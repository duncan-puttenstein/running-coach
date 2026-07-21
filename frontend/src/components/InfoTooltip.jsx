import { useState } from "react";
import { Info } from "lucide-react";
import { bodyFont } from "../constants.js";

export default function InfoTooltip({ text, C }) {
  const [open, setOpen] = useState(false);

  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        style={{ background: "none", border: "none", cursor: "pointer", color: C.chalkDim, display: "flex", padding: 0 }}
        aria-label="Uitleg"
      >
        <Info size={13} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 19 }} />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: "absolute", top: "130%", left: 0, zIndex: 20, background: C.ink, border: `1px solid ${C.slate}`, borderRadius: 8, padding: 10, width: 220, fontFamily: bodyFont, fontSize: 11, color: C.chalk, lineHeight: 1.4, boxShadow: "0 4px 12px rgba(0,0,0,0.35)" }}
          >
            {text}
          </div>
        </>
      )}
    </span>
  );
}
