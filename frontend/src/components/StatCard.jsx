import { bodyFont, monoFont } from "../constants.js";

export default function StatCard({ label, value, unit, accent, sub, C }) {
  return (
    <div style={{ background: C.panel, borderRadius: 8, padding: "16px 18px", flex: "1 1 140px", borderLeft: `3px solid ${accent || C.slate}` }}>
      <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.chalkDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: monoFont, fontSize: 24, color: C.chalk, fontVariantNumeric: "tabular-nums" }}>
        {value}
        {unit && <span style={{ fontSize: 13, color: C.chalkDim, marginLeft: 4 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontFamily: bodyFont, fontSize: 10, color: C.chalkDim, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
