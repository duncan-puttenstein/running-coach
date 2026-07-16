import { bodyFont } from "../constants.js";

export default function Badge({ children, color }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${color}22`, color, border: `1px solid ${color}55`, borderRadius: 20, padding: "3px 10px", fontFamily: bodyFont, fontSize: 12, fontWeight: 600 }}>
      {children}
    </span>
  );
}
