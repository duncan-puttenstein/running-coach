import { bodyFont, monoFont } from "../constants.js";
import { fmtDuration } from "../utils/format.js";

export default function BestEffortsTable({ bestEfforts, C }) {
  const rows = [
    { label: "1K", effort: bestEfforts.best1k },
    { label: "1 mijl", effort: bestEfforts.bestMile },
    { label: "5K", effort: bestEfforts.best5k },
    { label: "10K", effort: bestEfforts.best10k },
    { label: "Halve marathon", effort: bestEfforts.bestHalf },
  ].filter((r) => r.effort);

  if (!rows.length) {
    return <div style={{ color: C.chalkDim, fontFamily: bodyFont, fontSize: 13 }}>Geen best-effort tijden van Strava beschikbaar binnen deze run.</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontFamily: bodyFont, fontSize: 13, color: C.chalk, padding: "6px 0", borderBottom: i < rows.length - 1 ? `1px solid ${C.slate}44` : "none" }}>
          <span>{r.label}</span>
          <span style={{ fontFamily: monoFont, color: C.gold }}>{fmtDuration(r.effort.movingSec)}{r.effort.prRank ? ` — PR #${r.effort.prRank}` : ""}</span>
        </div>
      ))}
    </div>
  );
}
