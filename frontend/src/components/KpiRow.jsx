import { avgPace } from "../utils/analysis.js";
import { fmtPace, fmtHMS, fmtDate } from "../utils/format.js";
import StatCard from "./StatCard.jsx";

function computeMetrics(runs) {
  const volumeKm = runs.reduce((a, r) => a + r.distance, 0);
  const volumeSec = runs.reduce((a, r) => a + r.movingSec, 0);
  const avgPaceSecPerKm = volumeKm > 0 ? volumeSec / volumeKm : null;
  const hrRuns = runs.filter((r) => r.avgHeartrate != null);
  const avgHr = hrRuns.length ? hrRuns.reduce((a, r) => a + r.avgHeartrate, 0) / hrRuns.length : null;
  return { volumeKm, volumeSec, avgPaceSecPerKm, avgHr };
}

function ChangeBadge({ current, previous, lowerIsBetter, C }) {
  if (current == null || previous == null || previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  if (!isFinite(pct)) return null;
  if (Math.abs(pct) < 1) return <span style={{ color: C.chalkDim }}>≈ gelijk aan vorige periode</span>;
  const isImprovement = lowerIsBetter ? pct < 0 : pct > 0;
  const color = isImprovement ? C.gold : C.red;
  const sign = pct > 0 ? "+" : "";
  return <span style={{ color, fontWeight: 700 }}>{sign}{pct.toFixed(0)}% t.o.v. vorige periode</span>;
}

export default function KpiRow({ runs, previousRuns, C }) {
  const cur = computeMetrics(runs);
  const prev = previousRuns ? computeMetrics(previousRuns) : null;

  const longest = runs.reduce((best, r) => (!best || r.distance > best.distance ? r : best), null);
  const fastest = runs.reduce((best, r) => (!best || avgPace(r) < avgPace(best) ? r : best), null);

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Harde cijfers — geen periode-vergelijking */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <StatCard label="Activiteiten" value={runs.length} accent={C.chalk} C={C} />
        <StatCard
          label="Langste sessie"
          value={longest ? longest.distance : "—"}
          unit="km"
          accent={C.slate}
          sub={longest ? `${longest.type} · ${fmtDate(longest.date)}` : undefined}
          C={C}
        />
        <StatCard
          label="Snelste sessie"
          value={fastest ? fmtPace(avgPace(fastest)) : "—"}
          unit="/km"
          accent={C.chalk}
          sub={fastest ? `${fastest.type} · ${fmtDate(fastest.date)}` : undefined}
          C={C}
        />
      </div>

      {/* Volume/pace/HR — met % t.o.v. vorige even lange periode */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard
          label="Volume (km)"
          value={cur.volumeKm.toFixed(1)}
          unit="km"
          accent={C.red}
          C={C}
          sub={prev ? <ChangeBadge current={cur.volumeKm} previous={prev.volumeKm} lowerIsBetter={false} C={C} /> : undefined}
        />
        <StatCard
          label="Volume (tijd)"
          value={fmtHMS(cur.volumeSec)}
          accent={C.gold}
          C={C}
          sub={prev ? <ChangeBadge current={cur.volumeSec} previous={prev.volumeSec} lowerIsBetter={false} C={C} /> : undefined}
        />
        <StatCard
          label="Gemiddelde pace"
          value={cur.avgPaceSecPerKm ? fmtPace(cur.avgPaceSecPerKm) : "—"}
          unit="/km"
          accent={C.red}
          C={C}
          sub={prev && cur.avgPaceSecPerKm ? <ChangeBadge current={cur.avgPaceSecPerKm} previous={prev.avgPaceSecPerKm} lowerIsBetter={true} C={C} /> : undefined}
        />
        <StatCard
          label="Gemiddelde hartslag"
          value={cur.avgHr ? Math.round(cur.avgHr) : "—"}
          unit={cur.avgHr ? "bpm" : undefined}
          accent={C.gold}
          C={C}
          sub={
            cur.avgHr
              ? prev && prev.avgHr
                ? <ChangeBadge current={cur.avgHr} previous={prev.avgHr} lowerIsBetter={true} C={C} />
                : undefined
              : "geen HR-data"
          }
        />
      </div>
    </div>
  );
}
