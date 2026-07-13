import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

// ---------- Database (Postgres / Supabase) ----------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY,
      access_token TEXT,
      refresh_token TEXT,
      expires_at BIGINT
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS athlete (
      id INTEGER PRIMARY KEY,
      strava_athlete_id TEXT,
      stats_json TEXT,
      stats_updated_at BIGINT
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      strava_id TEXT UNIQUE,
      date TEXT,
      type TEXT,
      distance REAL,
      moving_sec INTEGER,
      splits TEXT,
      split_distances TEXT,
      elev TEXT,
      note TEXT,
      suffer_score INTEGER,
      achievement_count INTEGER,
      pr_count INTEGER,
      best_efforts TEXT,
      zones TEXT,
      raw_json TEXT
    );
  `);
}
await initDb();

// ---------- Strava OAuth ----------
app.get("/auth/strava", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID,
    redirect_uri: `${process.env.BACKEND_URL}/auth/strava/callback`,
    response_type: "code",
    approval_prompt: "auto",
    scope: "activity:read_all,profile:read_all",
  });
  res.redirect(`https://www.strava.com/oauth/authorize?${params}`);
});

app.get("/auth/strava/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("Missing authorization code");

  try {
    const tokenRes = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      }),
    });
    const data = await tokenRes.json();
    if (!data.access_token) throw new Error(JSON.stringify(data));

    await pool.query(
      `INSERT INTO tokens (id, access_token, refresh_token, expires_at)
       VALUES (1, $1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         expires_at = EXCLUDED.expires_at`,
      [data.access_token, data.refresh_token, data.expires_at]
    );

    res.redirect(`${process.env.FRONTEND_URL}?connected=true`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Strava connection failed. Check server logs.");
  }
});

async function getValidAccessToken() {
  const { rows } = await pool.query("SELECT * FROM tokens WHERE id = 1");
  const row = rows[0];
  if (!row) throw new Error("Not connected to Strava yet — visit /auth/strava first");

  const now = Math.floor(Date.now() / 1000);
  if (row.expires_at > now + 60) return row.access_token;

  const refreshRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: row.refresh_token,
    }),
  });
  const data = await refreshRes.json();
  await pool.query(
    `UPDATE tokens SET access_token = $1, refresh_token = $2, expires_at = $3 WHERE id = 1`,
    [data.access_token, data.refresh_token, data.expires_at]
  );
  return data.access_token;
}

async function stravaGet(path, token) {
  const res = await fetch(`https://www.strava.com/api/v3${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Strava ${path} failed: ${res.status}`);
  return res.json();
}

// ---------- Sync runs from Strava ----------
app.post("/api/sync", async (req, res) => {
  try {
    const token = await getValidAccessToken();

    try {
      const me = await stravaGet("/athlete", token);
      const stats = await stravaGet(`/athletes/${me.id}/stats`, token);
      await pool.query(
        `INSERT INTO athlete (id, strava_athlete_id, stats_json, stats_updated_at)
         VALUES (1, $1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET
           strava_athlete_id = EXCLUDED.strava_athlete_id,
           stats_json = EXCLUDED.stats_json,
           stats_updated_at = EXCLUDED.stats_updated_at`,
        [String(me.id), JSON.stringify(stats), Date.now()]
      );
    } catch (e) {
      console.warn("Could not refresh athlete stats:", e.message);
    }

    const activitiesRes = await fetch(
      "https://www.strava.com/api/v3/athlete/activities?per_page=50",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const activities = await activitiesRes.json();
    const allRuns = activities.filter((a) => a.sport_type === "Run" || a.type === "Run");

    const { rows: existingRows } = await pool.query("SELECT strava_id FROM runs");
    const existingIds = new Set(existingRows.map((r) => r.strava_id));
    const newRuns = allRuns.filter((a) => !existingIds.has(String(a.id)));

    for (const activity of newRuns) {
      let splits = [];
      let splitDistances = [];
      let elev = [];
      try {
        const streams = await stravaGet(
          `/activities/${activity.id}/streams?keys=distance,time,altitude&key_by_type=true`,
          token
        );
        if (streams.distance && streams.time) {
          const dist = streams.distance.data;
          const time = streams.time.data;
          const alt = streams.altitude ? streams.altitude.data : null;
          const totalKm = activity.distance / 1000;
          const fullKm = Math.floor(totalKm);
          const remainder = +(totalKm - fullKm).toFixed(2);
          const targets = [];
          for (let k = 1; k <= fullKm; k++) targets.push(k * 1000);
          if (remainder > 0.05) targets.push(activity.distance);

          let lastT = 0, lastIdx = 0;
          for (const target of targets) {
            const idx = dist.findIndex((d) => d >= target);
            if (idx === -1) break;
            const t = idx === 0 ? time[0] : time[idx - 1] +
              ((target - dist[idx - 1]) / (dist[idx] - dist[idx - 1])) * (time[idx] - time[idx - 1]);
            splits.push(Math.round(t - lastT));
            splitDistances.push(target === activity.distance ? remainder : 1);
            if (alt) elev.push(+(alt[idx] - alt[lastIdx]).toFixed(1));
            lastT = t;
            lastIdx = idx;
          }
        }
      } catch (e) {
        splits = [activity.moving_time];
        splitDistances = [+(activity.distance / 1000).toFixed(2)];
        elev = [activity.total_elevation_gain || 0];
      }

      let bestEfforts = [];
      let sufferScore = null;
      let achievementCount = activity.achievement_count ?? null;
      let prCount = activity.pr_count ?? null;
      try {
        const detail = await stravaGet(`/activities/${activity.id}`, token);
        sufferScore = detail.suffer_score ?? null;
        achievementCount = detail.achievement_count ?? achievementCount;
        prCount = detail.pr_count ?? prCount;
        if (Array.isArray(detail.best_efforts)) {
          bestEfforts = detail.best_efforts.map((be) => ({
            name: be.name,
            distance: be.distance,
            movingSec: be.moving_time,
            prRank: be.pr_rank || null,
          }));
        }
      } catch (e) {
        console.warn(`Could not fetch detail for activity ${activity.id}:`, e.message);
      }

      let zones = null;
      try {
        const zoneData = await stravaGet(`/activities/${activity.id}/zones`, token);
        const hrZones = zoneData.find((z) => z.type === "heartrate");
        if (hrZones) {
          zones = hrZones.distribution_buckets.map((b, i) => ({
            zone: i + 1, min: b.min, max: b.max, seconds: b.time,
          }));
        }
      } catch (e) {
        // no HR data — fine
      }

      await pool.query(
        `INSERT INTO runs
          (id, strava_id, date, type, distance, moving_sec, splits, split_distances, elev, note,
           suffer_score, achievement_count, pr_count, best_efforts, zones, raw_json)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (strava_id) DO NOTHING`,
        [
          `strava_${activity.id}`,
          String(activity.id),
          activity.start_date_local,
          guessRunType(activity),
          +(activity.distance / 1000).toFixed(2),
          activity.moving_time,
          JSON.stringify(splits),
          JSON.stringify(splitDistances),
          JSON.stringify(elev),
          activity.name || null,
          sufferScore,
          achievementCount,
          prCount,
          JSON.stringify(bestEfforts),
          JSON.stringify(zones),
          JSON.stringify(activity),
        ]
      );
    }

    res.json({ synced: newRuns.length, skipped: allRuns.length - newRuns.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

function guessRunType(activity) {
  const paceMinPerKm = activity.moving_time / 60 / (activity.distance / 1000);
  if (activity.distance / 1000 >= 9) return "Long";
  if (paceMinPerKm < 5.3) return "Tempo";
  return "Test";
}

// ---------- Serve data to the frontend ----------
app.get("/api/runs", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM runs ORDER BY date ASC");
  const runs = rows.map((r) => ({
    id: r.id,
    date: r.date,
    type: r.type,
    distance: r.distance,
    movingSec: r.moving_sec,
    splits: JSON.parse(r.splits),
    splitDistances: JSON.parse(r.split_distances),
    elev: JSON.parse(r.elev),
    note: r.note,
    sufferScore: r.suffer_score,
    achievementCount: r.achievement_count,
    prCount: r.pr_count,
    bestEfforts: r.best_efforts ? JSON.parse(r.best_efforts) : [],
    zones: r.zones ? JSON.parse(r.zones) : null,
  }));
  res.json(runs);
});

app.get("/api/athlete/stats", async (req, res) => {
  const { rows } = await pool.query("SELECT stats_json, stats_updated_at FROM athlete WHERE id = 1");
  const row = rows[0];
  if (!row) return res.json(null);
  res.json({ stats: JSON.parse(row.stats_json), updatedAt: Number(row.stats_updated_at) });
});

app.get("/api/status", async (req, res) => {
  const { rows } = await pool.query("SELECT id FROM tokens WHERE id = 1");
  res.json({ connected: rows.length > 0 });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Running Coach backend on :${port}`));
