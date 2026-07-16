import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, ChevronDown, ChevronUp, Timer, Flag, TrendingUp, Award } from "lucide-react";
import { avgPace } from "../utils/analysis.js";
import { fmtPace, fmtDuration, fmtDate, typeColor, currentPhase, daysUntil } from "../utils/format.js";
import { displayFont, bodyFont, monoFont } from "../constants.js";
import SplitLadder from "../components/SplitLadder.jsx";
import StatCard from "../components/StatCard.jsx";
import CountdownLane from "../components/CountdownLane.jsx";

export default function DashboardTab({ allRuns, onShowModal, C }) {
  const [expandedRun, setExpandedRun] = useState(null);
  const [selectedRunId, setSelectedRunId] = useState(allRuns.length ? allRuns[allRuns.length - 1].id : null);

  const selectedRun = allRuns.find((r) => r.id === selectedRunId) || allRuns[allRuns.length - 1];
  const phase = currentPhase();
  const footballDays = daysUntil("2026-09-01");
  const sixteenKDays = daysUntil("2026-09-20");
  const chartData = allRuns.map((r) => ({ name: `#${r.order}`, pace: +(avgPace(r) / 60).toFixed(2), type: r.type }));

  const longRuns = allRuns.filter((r) => r.type === "Long");
  const tempoRuns = allRuns.filter((r) => r.type === "Tempo");
  const intervalRuns = allRuns.filter((r) => r.type === "Interval");
  const easyPace = longRuns.length ? longRuns.reduce((a, r) => a + avgPace(r), 0) / longRuns.length : null;
  const tempoPace = tempoRuns.length ? Math.min(...tempoRuns.map(avgPace)) : null;
  const intervalPace = intervalRuns.length ? Math.min(...intervalRuns.map(avgPace)) : null;
  const qualityRuns = allRuns.filter((r) => r.type === "Tempo" || r.type === "Interval" || r.type === "Test");
  const bestEffort = qualityRuns.reduce((best, r) => (!best || avgPace(r) < avgPace(best) ? r : best), null);
  const riegel = (targetKm) => (bestEffort ? bestEffort.movingSec * Math.pow(targetKm / bestEffort.distance, 1.06) : null);

  if (allRuns.length === 0) {
    return (
      <div style={{ background: C.panel, borderRadius: 10, padding: 40, textAlign: "center", color: C.chalkDim }}>
        Nog geen runs. Verbind met Strava of voeg handmatig een run toe.
        <div style={{ marginTop: 16 }}>
          <button onClick={onShowModal} style={{ background: C.red, border: "none", borderRadius: 6, padding: "10px 16px", color: C.chalk, fontFamily: bodyFont, fontSize: 13, cursor: "pointer" }}>Run handmatig toevoegen</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
        <CountdownLane title="⚽ Football-ready (hoofddoel)" dateLabel="1 september 2026" days={footballDays} color={C.red} sub="Prioriteit bij conflict met Doel 2" C={C} />
        <CountdownLane title="🏁 16K run" dateLabel="20 september 2026" days={sixteenKDays} color={C.slate} sub="Piek ~14-15km rond 13 sept" C={C} />
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
        <StatCard label="Easy pace" value={easyPace ? fmtPace(easyPace) : "—"} unit="/km" accent={C.chalk} C={C} />
        <StatCard label="Tempo pace" value={tempoPace ? fmtPace(tempoPace) : "—"} unit="/km" accent={C.red} C={C} />
        <StatCard label="Interval pace" value={intervalPace ? fmtPace(intervalPace) : "—"} unit="/km" accent={C.gold} C={C} />
        <StatCard label="Est. 5K" value={fmtDuration(riegel(5))} accent={C.slate} C={C} />
        <StatCard label="Est. 10K" value={fmtDuration(riegel(10))} accent={C.slate} C={C} />
        <StatCard label="Est. Half" value={fmtDuration(riegel(21.1))} accent={C.slate} C={C} />
      </div>

      {selectedRun && (
        <div style={{ background: C.panelLight, borderRadius: 10, padding: 22, marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 18, color: C.chalk, letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: 8 }}><Timer size={18} color={C.red} /> SPLIT LADDER</div>
              <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.chalkDim, marginTop: 2 }}>Run #{selectedRun.order} · {selectedRun.type} · {selectedRun.distance} km · {fmtDate(selectedRun.date)}</div>
            </div>
            <select value={selectedRunId} onChange={(e) => setSelectedRunId(e.target.value)} style={{ background: C.ink, border: `1px solid ${C.slate}`, borderRadius: 6, color: C.chalk, padding: "8px 12px", fontFamily: monoFont, fontSize: 13 }}>
              {allRuns.map((r) => <option key={r.id} value={r.id}>Run #{r.order} — {r.type} ({r.distance}km)</option>)}
            </select>
          </div>
          <SplitLadder run={selectedRun} C={C} />
        </div>
      )}

      <div style={{ background: C.panel, borderRadius: 10, padding: 22, marginBottom: 28 }}>
        <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 18, color: C.chalk, letterSpacing: "0.03em", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}><TrendingUp size={18} color={C.red} /> PACE-ONTWIKKELING</div>
        <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.chalkDim, marginBottom: 16 }}>Gemiddelde pace per run (lager = sneller)</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ left: -10, right: 10 }}>
            <CartesianGrid stroke={C.slate} strokeOpacity={0.3} vertical={false} />
            <XAxis dataKey="name" stroke={C.chalkDim} tick={{ fontFamily: monoFont, fontSize: 11 }} />
            <YAxis stroke={C.chalkDim} tick={{ fontFamily: monoFont, fontSize: 11 }} reversed tickFormatter={(v) => `${v.toFixed(1)}`} width={35} />
            <Tooltip contentStyle={{ background: C.ink, border: `1px solid ${C.slate}`, borderRadius: 6, fontFamily: monoFont, fontSize: 12 }} labelStyle={{ color: C.chalkDim }} formatter={(value, name, props) => [`${fmtPace(value * 60)}/km`, props.payload.type]} />
            <Line type="monotone" dataKey="pace" stroke={C.red} strokeWidth={2} dot={{ fill: C.gold, r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 18, color: C.chalk, letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: 8 }}><Flag size={18} color={C.red} /> RUN LOG</div>
          <button onClick={onShowModal} style={{ display: "flex", alignItems: "center", gap: 6, background: C.panel, border: `1px solid ${C.slate}`, borderRadius: 6, padding: "8px 14px", color: C.chalk, fontFamily: displayFont, fontWeight: 700, fontSize: 13, letterSpacing: "0.05em", cursor: "pointer" }}><Plus size={15} /> HANDMATIG TOEVOEGEN</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[...allRuns].reverse().map((run) => (
            <div key={run.id}>
              <div onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.panel, padding: "12px 16px", borderRadius: expandedRun === run.id ? "6px 6px 0 0" : 6, cursor: "pointer", borderLeft: `3px solid ${typeColor(run.type, C)}`, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: monoFont, fontSize: 12, color: C.chalkDim, width: 30 }}>#{run.order}</span>
                  <span style={{ fontFamily: bodyFont, fontSize: 13, color: C.chalk, fontWeight: 600, minWidth: 60 }}>{run.type}</span>
                  <span style={{ fontFamily: bodyFont, fontSize: 12, color: C.chalkDim }}>{fmtDate(run.date)}</span>
                  {run.prCount > 0 && <Award size={13} color={C.gold} />}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <span style={{ fontFamily: monoFont, fontSize: 13, color: C.chalk }}>{run.distance} km</span>
                  <span style={{ fontFamily: monoFont, fontSize: 13, color: C.chalk }}>{fmtDuration(run.movingSec)}</span>
                  <span style={{ fontFamily: monoFont, fontSize: 13, color: C.red }}>{fmtPace(avgPace(run))}/km</span>
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
      </div>
    </>
  );
}
