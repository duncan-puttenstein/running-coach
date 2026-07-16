import { useState, useEffect } from "react";
import { TrendingUp, Flag, Award } from "lucide-react";
import { API_BASE } from "../constants.js";
import { fmtDuration, fmtKm } from "../utils/format.js";
import Section from "../components/Section.jsx";
import StatCard from "../components/StatCard.jsx";

function StatsTotalsRow({ label, totals, C }) {
  if (!totals) return null;
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
      <StatCard label={`${label} — runs`} value={totals.count ?? 0} accent={C.chalk} C={C} />
      <StatCard label={`${label} — afstand`} value={fmtKm(totals.distance)} unit="km" accent={C.red} C={C} />
      <StatCard label={`${label} — tijd`} value={fmtDuration(totals.moving_time)} accent={C.gold} C={C} />
      <StatCard label={`${label} — hoogtemeters`} value={Math.round(totals.elevation_gain || 0)} unit="m" accent={C.slate} C={C} />
    </div>
  );
}

export default function StatistiekenTab({ connected, C }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/athlete/stats`);
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!connected) {
    return <div style={{ color: C.chalkDim, padding: 20 }}>Verbind eerst met Strava om je statistieken te zien.</div>;
  }
  if (loading) return <div style={{ color: C.chalkDim, padding: 20 }}>Laden...</div>;
  if (!stats || !stats.stats) return <div style={{ color: C.chalkDim, padding: 20 }}>Nog geen statistieken — klik op "Ververs Strava" om ze op te halen.</div>;

  const s = stats.stats;

  return (
    <div>
      <Section title="LAATSTE 4 WEKEN" icon={<TrendingUp size={16} color={C.red} />} C={C}>
        <StatsTotalsRow label="4 weken" totals={s.recent_run_totals} C={C} />
      </Section>
      <Section title="DIT JAAR (YTD)" icon={<Flag size={16} color={C.red} />} C={C}>
        <StatsTotalsRow label="YTD" totals={s.ytd_run_totals} C={C} />
      </Section>
      <Section title="ALL-TIME" icon={<Award size={16} color={C.red} />} C={C}>
        <StatsTotalsRow label="All-time" totals={s.all_run_totals} C={C} />
      </Section>
      {stats.updatedAt && (
        <div style={{ fontSize: 11, color: C.chalkDim, textAlign: "center", marginTop: 10 }}>
          Bijgewerkt: {new Date(stats.updatedAt).toLocaleString("nl-NL")} — ververs via de knop bovenaan om opnieuw op te halen.
        </div>
      )}
    </div>
  );
}
