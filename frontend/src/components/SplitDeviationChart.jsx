import { bodyFont, monoFont } from "../constants.js";

export default function SplitDeviationChart({ paces, C }) {
  if (!paces || paces.length < 2) {
    return <div style={{ color: C.chalkDim, fontFamily: bodyFont, fontSize: 13 }}>Onvoldoende splits voor deze weergave.</div>;
  }

  const avg = paces.reduce((a, b) => a + b, 0) / paces.length;
  const deviations = paces.map((p) => p - avg); // positive = slower than average, negative = faster
  const maxAbs = Math.max(...deviations.map(Math.abs), 1);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", height: 140, gap: 6 }}>
        {deviations.map((d, i) => {
          const heightPct = (Math.abs(d) / maxAbs) * 50;
          const isSlower = d > 0;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "center" }}>
              <div style={{ height: "50%", display: "flex", alignItems: "flex-end", width: "100%", justifyContent: "center" }}>
                {isSlower && <div style={{ width: "70%", maxWidth: 24, height: `${heightPct}%`, background: C.red, borderRadius: "3px 3px 0 0" }} />}
              </div>
              <div style={{ width: "100%", borderTop: `1px solid ${C.slate}` }} />
              <div style={{ height: "50%", display: "flex", alignItems: "flex-start", width: "100%", justifyContent: "center" }}>
                {!isSlower && <div style={{ width: "70%", maxWidth: 24, height: `${heightPct}%`, background: C.gold, borderRadius: "0 0 3px 3px" }} />}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        {deviations.map((_, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", fontFamily: monoFont, fontSize: 10, color: C.chalkDim }}>{i + 1}</div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 10, fontFamily: bodyFont, fontSize: 11, color: C.chalkDim }}>
        <span><span style={{ color: C.gold }}>●</span> sneller dan gemiddeld</span>
        <span><span style={{ color: C.red }}>●</span> langzamer dan gemiddeld</span>
      </div>
    </div>
  );
}
