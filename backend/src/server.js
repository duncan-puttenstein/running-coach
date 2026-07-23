import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// ---------- Database (Postgres / Supabase) ----------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      strava_athlete_id TEXT UNIQUE,
      name TEXT,
      created_at BIGINT
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tokens (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      access_token TEXT,
      refresh_token TEXT,
      expires_at BIGINT
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS athlete_stats (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
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
  // add user_id to runs if this is an existing table from the single-user version
  await pool.query(`ALTER TABLE runs ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id);`);
  await pool.query(`ALTER TABLE runs ADD COLUMN IF NOT EXISTS avg_heartrate REAL;`);
  await pool.query(`ALTER TABLE runs ADD COLUMN IF NOT EXISTS excluded BOOLEAN DEFAULT FALSE;`);
  await pool.query(`ALTER TABLE runs ADD COLUMN IF NOT EXISTS hr_splits TEXT;`);
  await pool.query(`ALTER TABLE runs ADD COLUMN IF NOT EXISTS route TEXT;`);
}
await initDb();

// ---------- Auth helpers ----------
function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "90d" });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not logged in" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

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

    // who just logged in?
    const athleteRes = await fetch("https://www.strava.com/api/v3/athlete", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const athlete = await athleteRes.json();
    const userId = String(athlete.id);
    const name = `${athlete.firstname || ""} ${athlete.lastname || ""}`.trim() || "Hardloper";

    await pool.query(
      `INSERT INTO users (id, strava_athlete_id, name, created_at)
       VALUES ($1, $1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [userId, name, Date.now()]
    );

    await pool.query(
      `INSERT INTO tokens (user_id, access_token, refresh_token, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         expires_at = EXCLUDED.expires_at`,
      [userId, data.access_token, data.refresh_token, data.expires_at]
    );

    // one-time claim: any legacy runs from before multi-user existed get
    // assigned to whoever connects first (harmless no-op after that)
    await pool.query(`UPDATE runs SET user_id = $1 WHERE user_id IS NULL`, [userId]);

    const jwtToken = signToken(userId);
    res.redirect(`${process.env.FRONTEND_URL}/?token=${jwtToken}&connected=true`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Strava connection failed. Check server logs.");
  }
});

async function getValidAccessToken(userId) {
  const { rows } = await pool.query("SELECT * FROM tokens WHERE user_id = $1", [userId]);
  const row = rows[0];
  if (!row) throw new Error("Not connected to Strava yet");

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
    `UPDATE tokens SET access_token = $1, refresh_token = $2, expires_at = $3 WHERE user_id = $4`,
    [data.access_token, data.refresh_token, data.expires_at, userId]
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

// ---------- Who am I ----------
app.get("/api/me", requireAuth, async (req, res) => {
  const { rows } = await pool.query("SELECT name FROM users WHERE id = $1", [req.userId]);
  if (!rows[0]) return res.status(404).json({ error: "User not found" });
  res.json({ name: rows[0].name });
});

// ---------- Sync runs from Strava (scoped to the logged-in user) ----------
app.post("/api/sync", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const token = await getValidAccessToken(userId);

    try {
      const me = await stravaGet("/athlete", token);
      const stats = await stravaGet(`/athletes/${me.id}/stats`, token);
      await pool.query(
        `INSERT INTO athlete_stats (user_id, stats_json, stats_updated_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET
           stats_json = EXCLUDED.stats_json,
           stats_updated_at = EXCLUDED.stats_updated_at`,
        [userId, JSON.stringify(stats), Date.now()]
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

    const { rows: existingRows } = await pool.query(
      "SELECT strava_id FROM runs WHERE user_id = $1",
      [userId]
    );
    const existingIds = new Set(existingRows.map((r) => r.strava_id));
    const newRuns = allRuns.filter((a) => !existingIds.has(String(a.id)));

    for (const activity of newRuns) {
      let splits = [];
      let splitDistances = [];
      let elev = [];
      let hrSplits = [];
      let route = [];
      try {
        const streams = await stravaGet(
          `/activities/${activity.id}/streams?keys=distance,time,altitude,latlng,heartrate&key_by_type=true`,
          token
        );
        if (streams.distance && streams.time) {
          const dist = streams.distance.data;
          const time = streams.time.data;
          const alt = streams.altitude ? streams.altitude.data : null;
          const hr = streams.heartrate ? streams.heartrate.data : null;
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
            if (hr) {
              const segment = hr.slice(lastIdx, idx + 1).filter((v) => v != null);
              hrSplits.push(segment.length ? Math.round(segment.reduce((a, b) => a + b, 0) / segment.length) : null);
            }
            lastT = t;
            lastIdx = idx;
          }
        }
        if (streams.latlng && streams.latlng.data) {
          const points = streams.latlng.data;
          const step = Math.max(1, Math.floor(points.length / 150)); // downsample to ~150 points
          route = points.filter((_, i) => i % step === 0);
        }
      } catch (e) {
        splits = [activity.moving_time];
        splitDistances = [+(activity.distance / 1000).toFixed(2)];
        elev = [activity.total_elevation_gain || 0];
      }

      let bestEfforts = [];
      let sufferScore = null;
      let avgHeartrate = null;
      let achievementCount = activity.achievement_count ?? null;
      let prCount = activity.pr_count ?? null;
      try {
        const detail = await stravaGet(`/activities/${activity.id}`, token);
        sufferScore = detail.suffer_score ?? null;
        avgHeartrate = detail.average_heartrate ?? null;
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
          (id, strava_id, user_id, date, type, distance, moving_sec, splits, split_distances, elev, note,
           suffer_score, achievement_count, pr_count, best_efforts, zones, avg_heartrate, hr_splits, route, raw_json)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
         ON CONFLICT (strava_id) DO NOTHING`,
        [
          `strava_${activity.id}`,
          String(activity.id),
          userId,
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
          avgHeartrate,
          JSON.stringify(hrSplits),
          JSON.stringify(route),
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

// ---------- Serve data to the frontend (scoped to the logged-in user) ----------
app.get("/api/runs", requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM runs WHERE user_id = $1 ORDER BY date ASC",
    [req.userId]
  );
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
    avgHeartrate: r.avg_heartrate,
    excluded: r.excluded,
    hrSplits: r.hr_splits ? JSON.parse(r.hr_splits) : [],
    route: r.route ? JSON.parse(r.route) : [],
  }));
  res.json(runs);
});

app.get("/api/athlete/stats", requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    "SELECT stats_json, stats_updated_at FROM athlete_stats WHERE user_id = $1",
    [req.userId]
  );
  const row = rows[0];
  if (!row) return res.json(null);
  res.json({ stats: JSON.parse(row.stats_json), updatedAt: Number(row.stats_updated_at) });
});

// ---------- Edit a run: type and/or excluded ----------
app.patch("/api/runs/:id", requireAuth, async (req, res) => {
  const { type, excluded } = req.body;
  const updates = [];
  const values = [];
  let i = 1;

  if (type !== undefined) {
    if (!["Long", "Tempo", "Interval", "Test"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }
    updates.push(`type = $${i++}`);
    values.push(type);
  }
  if (excluded !== undefined) {
    updates.push(`excluded = $${i++}`);
    values.push(!!excluded);
  }
  if (!updates.length) return res.status(400).json({ error: "Nothing to update" });

  values.push(req.params.id, req.userId);
  const result = await pool.query(
    `UPDATE runs SET ${updates.join(", ")} WHERE id = $${i++} AND user_id = $${i++} RETURNING id`,
    values
  );
  if (!result.rows.length) return res.status(404).json({ error: "Run not found" });
  res.json({ success: true });
});

app.get("/api/status", requireAuth, async (req, res) => {
  const { rows } = await pool.query("SELECT user_id FROM tokens WHERE user_id = $1", [req.userId]);
  res.json({ connected: rows.length > 0 });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Running Coach backend on :${port}`));
