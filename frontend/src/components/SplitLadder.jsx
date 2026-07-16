import { fmtPace } from "../utils/format.js";
import { bodyFont, monoFont } from "../constants.js";

export default function SplitLadder({ run, C }) {
  if (!run.splits || run.splits.length === 0) {
    return <div style={{ color: C.chalkDim, fontFamily: bodyFont, fontSize: 13 }}>Geen split-data voor deze run.</div>;
  }
  const maxSplit = Math.max(...run.splits);
  const minSplit = Math.min(...run.splits);
  const range = maxSplit - minSplit || 1;
  const elev = run.elev && run.elev.length === run.splits.length ? run.elev : run.splits.map(() => 0);
  const maxElev = Math.max(...elev.map(Math.abs), 1);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 180, position: "relative", padding: "0 4px" }}>
        <svg width="100%" height="60" viewBox={`0 0 ${run.splits.length * 100} 60`} preserveAspectRatio="none" style={{ position: "absolute", bottom: 0, left: 0, opacity: 0.25 }}>
          <polyline points={elev.map((e, i) => `${i * 100 + 50},${30 - (e / maxElev) * 25}`).join(" ")} fill="none" stroke={C.gold} strokeWidth="2" />
        </svg>
        {run.splits.map((split, i) => {
          const dist = (run.splitDistances && run.splitDistances[i]) || 1;
          const heightPct = 25 + ((maxSplit - split) / range) * 75;
          const isFastest = split === minSplit;
          const isSlowest = split === maxSplit && run.splits.length > 1;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", position: "relative", zIndex: 1 }}>
              <div style={{ fontFamily: monoFont, fontSize: 11, color: isFastest ? C.gold : C.chalkDim, marginBottom: 4, fontVariantNumeric: "tabular-nums" }}>
                {fmtPace(split / dist)}
              </div>
              <div style={{ width: "100%", maxWidth: 34, height: `${heightPct}%`, background: isFastest ? C.gold : isSlowest ? C.slate : C.red, borderRadius: "2px 2px 0 0", transition: "height 0.3s ease" }} />
              <div style={{ fontFamily: monoFont, fontSize: 10, color: C.chalkDim, marginTop: 6 }}>{i + 1}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: bodyFont, fontSize: 11, color: C.chalkDim }}>
        <span>KM →</span>
        <span style={{ color: C.gold }}>● snelste split</span>
      </div>
    </div>
  );
}
