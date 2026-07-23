import { bodyFont, monoFont } from "../constants.js";

export default function HrSplitChart({ hrSplits, C }) {
  const valid = (hrSplits || []).filter((v) => v != null);
  if (!valid.length) {
    return <div style={{ color: C.chalkDim, fontFamily: bodyFont, fontSize: 13 }}>Geen hartslagdata per kilometer beschikbaar voor deze run.</div>;
  }

  const max = Math.max(...valid);
  const min = Math.min(...valid);
  const range = max - min || 1;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
        {hrSplits.map((hr, i) => {
          if (hr == null) return <div key={i} style={{ flex: 1 }} />;
          const heightPct = 20 + ((hr - min) / range) * 80;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
              <div style={{ fontFamily: monoFont, fontSize: 10, color: C.chalkDim, marginBottom: 4 }}>{hr}</div>
              <div style={{ width: "70%", maxWidth: 24, height: `${heightPct}%`, background: C.red, borderRadius: "3px 3px 0 0" }} />
              <div style={{ fontFamily: monoFont, fontSize: 10, color: C.chalkDim, marginTop: 6 }}>{i + 1}</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 8, fontFamily: bodyFont, fontSize: 11, color: C.chalkDim }}>Gemiddelde hartslag (bpm) per kilometer</div>
    </div>
  );
}
