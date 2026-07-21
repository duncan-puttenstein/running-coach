import { useState, useEffect } from "react";
import { Plus, ChevronDown, ChevronUp, Flag, Award, EyeOff, Eye } from "lucide-react";
import { avgPace } from "../utils/analysis.js";
import { fmtPace, fmtDuration, fmtDate, typeColor } from "../utils/format.js";
import { displayFont, bodyFont, monoFont } from "../constants.js";
import SplitLadder from "./SplitLadder.jsx";

const RUN_TYPES = ["Long", "Tempo", "Interval", "Test"];
const PAGE_SIZE = 10;

export default function RunLog({ runs, onShowModal, onUpdateRun, C }) {
  const [expandedRun, setExpandedRun] = useState(null);
  const [page, setPage] = useState(1);

  const sortedDesc = [...runs].reverse();
  const totalPages = Math.max(1, Math.ceil(sortedDesc.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [runs.length]);

  const pageRuns = sortedDesc.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 18, color: C.chalk, letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: 8 }}>
          <Flag size={18} color={C.red} /> RUN LOG
        </div>
        <button onClick={onShowModal} style={{ display: "flex", alignItems: "center", gap: 6, background: C.panel, border: `1px solid ${C.slate}`, borderRadius: 6, padding: "8px 14px", color: C.chalk, fontFamily: displayFont, fontWeight: 700, fontSize: 13, letterSpacing: "0.05em", cursor: "pointer" }}>
          <Plus size={15} /> HANDMATIG TOEVOEGEN
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {pageRuns.map((run) => (
          <div key={run.id} style={{ opacity: run.excluded ? 0.5 : 1 }}>
            <div
              onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.panel, padding: "12px 16px", borderRadius: expandedRun === run.id ? "6px 6px 0 0" : 6, cursor: "pointer", borderLeft: `3px solid ${typeColor(run.type, C)}`, flexWrap: "wrap", gap: 8 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <span style={{ fontFamily: monoFont, fontSize: 12, color: C.chalkDim, width: 30 }}>#{run.order}</span>
                <select
                  value={run.type}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => onUpdateRun(run.id, { type: e.target.value })}
                  style={{ background: C.ink, border: `1px solid ${C.slate}`, borderRadius: 6, color: C.chalk, padding: "3px 8px", fontFamily: bodyFont, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  {RUN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <span style={{ fontFamily: bodyFont, fontSize: 12, color: C.chalkDim }}>{fmtDate(run.date)}</span>
                {run.prCount > 0 && <Award size={13} color={C.gold} />}
                {run.excluded && <span style={{ fontFamily: bodyFont, fontSize: 11, color: C.chalkDim, fontStyle: "italic" }}>uitgesloten</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontFamily: monoFont, fontSize: 13, color: C.chalk }}>{run.distance} km</span>
                <span style={{ fontFamily: monoFont, fontSize: 13, color: C.chalk }}>{fmtDuration(run.movingSec)}</span>
                <span style={{ fontFamily: monoFont, fontSize: 13, color: C.red }}>{fmtPace(avgPace(run))}/km</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onUpdateRun(run.id, { excluded: !run.excluded }); }}
                  title={run.excluded ? "Weer meetellen" : "Uitsluiten van analyses"}
                  style={{ background: "none", border: "none", cursor: "pointer", color: C.chalkDim, display: "flex" }}
                >
                  {run.excluded ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                {expandedRun === run.id ? <ChevronUp size={16} color={C.chalkDim} /> : <ChevronDown size={16} color={C.chalkDim} />}
              </div>
            </div>
            {expandedRun === run.id && (
              <div style={{ background: C.panelLight, borderRadius: "0 0 6px 6px", padding: "16px" }}>
                <SplitLadder run={run} C={C} />
                {run.note && <div style={{ marginTop: 12, fontFamily: bodyFont, fontSize: 12, color: C.chalkDim }}>{run.note}</div>}
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 6, marginTop: 14, justifyContent: "center" }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                background: page === p ? C.red : C.panel,
                color: page === p ? C.chalk : C.chalkDim,
                border: `1px solid ${page === p ? C.red : C.slate}`,
                borderRadius: 6,
                padding: "6px 12px",
                fontFamily: monoFont,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
