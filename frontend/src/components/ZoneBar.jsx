import { bodyFont } from "../constants.js";
import { ZONE_LABELS, ZONE_COLORS } from "../constants.js";
import { fmtDuration } from "../utils/format.js";

export default function ZoneBar({ zoneSummary, C }) {
  if (!zoneSummary || !zoneSummary.length) {
    return <div style={{ color: C.chalkDim, fontFamily: bodyFont, fontSize: 13 }}>Geen hartslagzone-data beschikbaar voor deze run.</div>;
  }
  return (
    <div>
      <div style={{ display: "flex", width: "100%", height: 28, borderRadius: 6, overflow: "hidden", marginBottom: 10 }}>
        {zoneSummary.map((z, i) => (
          <div key={i} style={{ width: `${z.pct}%`, background: ZONE_COLORS[i % ZONE_COLORS.length] }} title={`${ZONE_LABELS[i] || `Zone ${z.zone}`}: ${z.pct.toFixed(0)}%`} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {zoneSummary.map((z, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: bodyFont, fontSize: 12, color: C.chalkDim }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: ZONE_COLORS[i % ZONE_COLORS.length], display: "inline-block" }} />
            {ZONE_LABELS[i] || `Zone ${z.zone}`}: {z.pct.toFixed(0)}% ({fmtDuration(z.seconds)})
          </div>
        ))}
      </div>
    </div>
  );
}
