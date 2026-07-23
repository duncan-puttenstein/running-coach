import { bodyFont } from "../constants.js";

const TYPE_LABELS = { all: "Alle types", Tempo: "Tempo Run", Long: "Long Run", Interval: "Interval", Test: "Easy Run" };
const TYPES = ["all", "Tempo", "Long", "Interval", "Test"];

export default function RunTypeFilterTabs({ value, onChange, C }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
      {TYPES.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            background: value === t ? C.red : C.panel,
            color: value === t ? C.chalk : C.chalkDim,
            border: `1px solid ${value === t ? C.red : C.slate}`,
            borderRadius: 20,
            padding: "6px 14px",
            fontFamily: bodyFont,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {TYPE_LABELS[t]}
        </button>
      ))}
    </div>
  );
}
