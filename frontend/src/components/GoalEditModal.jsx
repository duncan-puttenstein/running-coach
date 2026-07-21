import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { bodyFont, displayFont } from "../constants.js";

export default function GoalEditModal({ goal, onSave, onDelete, onClose, C }) {
  const [title, setTitle] = useState(goal.title || "");
  const [endDate, setEndDate] = useState(goal.endDate || "");
  const [targetKm, setTargetKm] = useState(goal.targetKm ?? "");
  const [subtitle, setSubtitle] = useState(goal.subtitle || "");
  const [icon, setIcon] = useState(goal.icon || "🎯");

  const inputStyle = { width: "100%", background: C.ink, border: `1px solid ${C.slate}`, borderRadius: 6, padding: "10px 12px", color: C.chalk, fontFamily: bodyFont, fontSize: 14, marginBottom: 14, boxSizing: "border-box" };
  const labelStyle = { fontFamily: bodyFont, fontSize: 11, color: C.chalkDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "block" };

  function handleSave() {
    if (!title.trim() || !endDate) return;
    onSave({ id: goal.id, title: title.trim(), endDate, targetKm: targetKm !== "" ? Number(targetKm) : null, subtitle: subtitle.trim(), icon: icon.trim() });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div style={{ background: C.panel, borderRadius: 10, padding: 28, width: "100%", maxWidth: 400, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 20, color: C.chalk, letterSpacing: "0.03em" }}>DOEL BEWERKEN</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.chalkDim }}><X size={20} /></button>
        </div>

        <label style={labelStyle}>Icoon (emoji, optioneel)</label>
        <input value={icon} onChange={(e) => setIcon(e.target.value)} style={inputStyle} placeholder="🎯" />

        <label style={labelStyle}>Titel</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} placeholder="bv. Marathon-doel" />

        <label style={labelStyle}>Einddatum</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />

        <label style={labelStyle}>Doelafstand in km (optioneel)</label>
        <input type="number" step="0.1" value={targetKm} onChange={(e) => setTargetKm(e.target.value)} style={inputStyle} placeholder="bv. 42.2" />

        <label style={labelStyle}>Ondertitel (optioneel)</label>
        <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} style={inputStyle} placeholder="bv. Piek 3 weken van tevoren" />

        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          {onDelete && (
            <button onClick={() => onDelete(goal.id)} style={{ background: "none", border: `1px solid ${C.slate}`, borderRadius: 6, padding: "0 14px", color: C.red, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Trash2 size={16} />
            </button>
          )}
          <button onClick={handleSave} style={{ flex: 1, background: C.red, border: "none", borderRadius: 6, padding: "12px", color: C.chalk, fontFamily: displayFont, fontWeight: 700, fontSize: 15, letterSpacing: "0.05em", cursor: "pointer" }}>
            OPSLAAN
          </button>
        </div>
      </div>
    </div>
  );
}
