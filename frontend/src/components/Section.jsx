import { displayFont } from "../constants.js";

export default function Section({ title, icon, children, C }) {
  return (
    <div style={{ background: C.panel, borderRadius: 10, padding: 22, marginBottom: 20 }}>
      <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 16, color: C.chalk, letterSpacing: "0.03em", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        {icon} {title}
      </div>
      {children}
    </div>
  );
}
