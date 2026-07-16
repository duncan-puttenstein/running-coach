import { useState } from "react";
import { X } from "lucide-react";
import { bodyFont, displayFont } from "../constants.js";

export default function AddRunModal({ onClose, onSave, C }) {
  const [type, setType] = useState("Long");
  const [distance, setDistance] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [splitsInput, setSplitsInput] = useState("");
  const [note, setNote] = useState("");

  const handleSave = () => {
    const dist = parseFloat(distance);
    const mvSec = parseInt(minutes || 0) * 60 + parseInt(seconds || 0);
    if (!dist || !mvSec) return;

    let splits = [];
    let splitDistances = [];
    if (splitsInput.trim()) {
      splitsInput.split(",").map((s) => s.trim()).filter(Boolean).forEach((p) => {
        const [m, s] = p.split(":").map(Number);
        splits.push(m * 60 + s);
        splitDistances.push(1);
      });
      const remainder = +(dist - Math.floor(dist)).toFixed(2);
      if (remainder > 0 && splitDistances.length) splitDistances[splitDistances.length - 1] = remainder;
    } else {
      splits = [mvSec];
      splitDistances = [dist];
    }

    onSave({
      id: `manual_${Date.now()}`,
      date: new Date().toISOString(),
      type, distance: dist, movingSec: mvSec, splits, splitDistances,
      elev: splits.map(() => 0),
      note: note || undefined,
      sufferScore: null, achievementCount: 0, prCount: 0, bestEfforts: [], zones: null,
    });
    onClose();
  };

  const inputStyle = { width: "100%", background: C.ink, border: `1px solid ${C.slate}`, borderRadius: 6, padding: "10px 12px", color: C.chalk, fontFamily: bodyFont, fontSize: 14, marginBottom: 14, boxSizing: "border-box" };
  const labelStyle = { fontFamily: bodyFont, fontSize: 11, color: C.chalkDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "block" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div style={{ background: C.panel, borderRadius: 10, padding: 28, width: "100%", maxWidth: 420, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 20, color: C.chalk, letterSpacing: "0.03em" }}>RUN HANDMATIG TOEVOEGEN</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.chalkDim }}><X size={20} /></button>
        </div>
        <label style={labelStyle}>Type</label>
        <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
          <option>Long</option><option>Tempo</option><option>Interval</option><option>Test</option>
        </select>
        <label style={labelStyle}>Afstand (km)</label>
        <input type="number" step="0.01" value={distance} onChange={(e) => setDistance(e.target.value)} style={inputStyle} placeholder="bv. 8.5" />
        <label style={labelStyle}>Moving time</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} placeholder="min" />
          <input type="number" value={seconds} onChange={(e) => setSeconds(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} placeholder="sec" />
        </div>
        <div style={{ height: 14 }} />
        <label style={labelStyle}>Splits per km (optioneel)</label>
        <input value={splitsInput} onChange={(e) => setSplitsInput(e.target.value)} style={inputStyle} placeholder="5:41, 6:32, 6:16, ..." />
        <label style={labelStyle}>Notitie (optioneel)</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} placeholder="bv. regen, drukte, ..." />
        <button onClick={handleSave} style={{ width: "100%", background: C.red, border: "none", borderRadius: 6, padding: "12px", color: C.chalk, fontFamily: displayFont, fontWeight: 700, fontSize: 15, letterSpacing: "0.05em", cursor: "pointer", marginTop: 6 }}>
          RUN OPSLAAN
        </button>
      </div>
    </div>
  );
}
