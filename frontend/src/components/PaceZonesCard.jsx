import { fmtPace } from "../utils/format.js";
import { bodyFont, monoFont } from "../constants.js";

const ZONE_COLORS = { 1: "#3A4964", 2: "#4C6785", 3: "#6C8BAE", 4: "#D9A544", 5: "#E08A2B", 6: "#C81D25" };

export default function PaceZonesCard({ paceZones, insight, C }) {
  if (!paceZones) {
    return (
      <div style={{ color: C.chalkDim, fontFamily: bodyFont, fontSize: 13 }}>
        Onvoldoende fitnessdata om pace-zones te berekenen — heb je al minstens één tempo- of testrun gelogd?
      </div>
    );
  }

  const sorted = [...paceZones].sort((a, b) => b.zone - a.zone); // Z6 (snelst) boven, Z1 (rustigst) onder

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((z) => (
          <div key={z.zone} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, fontFamily: monoFont, fontSize: 12, color: C.chalk, fontWeight: 700 }}>Z{z.zone}</div>
            <div style={{ flex: 1, background: C.ink, borderRadius: 4, height: 18, overflow: "hidden" }}>
              <div style={{ width: `${z.pct > 0 ? Math.max(z.pct, 2) : 0}%`, height: "100%", background: ZONE_COLORS[z.zone] }} />
            </div>
            <div style={{ width: 38, textAlign: "right", fontFamily: monoFont, fontSize: 12, color: C.chalk }}>{z.pct.toFixed(0)}%</div>
            <div style={{ width: 100, textAlign: "right", fontFamily: monoFont, fontSize: 11, color: C.chalkDim }}>
              {z.maxPaceSec === Infinity
                ? `> ${fmtPace(z.minPaceSec)}`
                : z.minPaceSec === 0
                ? `< ${fmtPace(z.maxPaceSec)}`
                : `${fmtPace(z.minPaceSec)}-${fmtPace(z.maxPaceSec)}`}
            </div>
          </div>
        ))}
      </div>

      {insight && (
        <div style={{ marginTop: 16, background: C.ink, border: `1px solid ${C.slate}`, borderRadius: 8, padding: 14, fontFamily: bodyFont, fontSize: 13, color: C.chalk, lineHeight: 1.5 }}>
          {insight}
        </div>
      )}

      <div style={{ marginTop: 10, fontFamily: bodyFont, fontSize: 11, color: C.chalkDim }}>
        Zones berekend per kilometer-split, op basis van je geschatte 5K-tempo op dat moment — minder precies dan een per-seconde meting, maar een goede indicatie.
      </div>
    </div>
  );
}
