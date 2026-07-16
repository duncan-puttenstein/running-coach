import { bodyFont, displayFont } from "../constants.js";

export default function CountdownLane({ title, dateLabel, days, color, sub, C }) {
  return (
    <div style={{ flex: 1, background: C.panel, borderRadius: 8, padding: "18px 20px", borderTop: `3px solid ${color}`, minWidth: 220 }}>
      <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.chalkDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 42, color: C.chalk, letterSpacing: "0.02em" }}>{days}</div>
        <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.chalkDim }}>dagen</div>
      </div>
      <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.chalkDim, marginTop: 4 }}>{dateLabel}</div>
      {sub && <div style={{ fontFamily: bodyFont, fontSize: 11, color, marginTop: 8 }}>{sub}</div>}
    </div>
  );
}
