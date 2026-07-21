import { useState } from "react";
import { bodyFont, monoFont } from "../constants.js";
import { RANGE_PRESETS } from "../utils/dateRangeFilter.js";

export default function DateRangeFilter({ value, onChange, C }) {
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const isCustomActive = value.key === "custom";

  const pillStyle = (active) => ({
    background: active ? C.red : C.panel,
    color: active ? C.chalk : C.chalkDim,
    border: `1px solid ${active ? C.red : C.slate}`,
    borderRadius: 20,
    padding: "6px 14px",
    fontFamily: bodyFont,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  });

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 24 }}>
      {RANGE_PRESETS.map((p) => (
        <button key={p.key} onClick={() => onChange({ key: p.key })} style={pillStyle(value.key === p.key)}>
          {p.label}
        </button>
      ))}

      <input
        type="date"
        value={customStart}
        onChange={(e) => setCustomStart(e.target.value)}
        style={{ background: C.panel, border: `1px solid ${C.slate}`, borderRadius: 6, padding: "6px 10px", color: C.chalk, fontFamily: monoFont, fontSize: 12 }}
      />
      <span style={{ color: C.chalkDim, fontSize: 12 }}>t/m</span>
      <input
        type="date"
        value={customEnd}
        onChange={(e) => setCustomEnd(e.target.value)}
        style={{ background: C.panel, border: `1px solid ${C.slate}`, borderRadius: 6, padding: "6px 10px", color: C.chalk, fontFamily: monoFont, fontSize: 12 }}
      />
      <button
        onClick={() => customStart && onChange({ key: "custom", start: customStart, end: customEnd })}
        disabled={!customStart}
        style={{ ...pillStyle(isCustomActive), opacity: customStart ? 1 : 0.5, cursor: customStart ? "pointer" : "not-allowed" }}
      >
        Toepassen
      </button>
    </div>
  );
}
