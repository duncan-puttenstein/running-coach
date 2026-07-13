import { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, X, ChevronDown, ChevronUp, Timer, Flag, TrendingUp } from "lucide-react";

// ---------- Design tokens ----------
const C = {
  ink: "#0F1826",
  panel: "#182437",
  panelLight: "#202F45",
  red: "#C81D25",
  chalk: "#EDE7DA",
  chalkDim: "#9AA5B8",
  slate: "#3A4964",
  gold: "#D9A544",
};

const displayFont = "'Arial Narrow', 'Helvetica Neue', Arial, sans-serif";
const bodyFont = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const monoFont = "'SF Mono', 'Roboto Mono', Menlo, Consolas, monospace";

// ---------- Seed data (your run history) ----------
const seedRuns = [
  { id: 1, order: 1, date: "~29 jun 2026", type: "Test", distance: 5.47, movingSec: 34 * 60 + 56,
    splits: [341, 392, 376, 383, 415, 403], splitDistances: [1,1,1,1,1,0.47],
    elev: [-22, -32, 1, 5, 38, 11] },
  { id: 2, order: 2, date: "~30 jun 2026", type: "Test", distance: 6.32, movingSec: 39 * 60,
    splits: [345, 352, 362, 375, 388, 397, 376], splitDistances: [1,1,1,1,1,1,0.32],
    elev: [-22, -32, 4, 9, 22, 14, 3] },
  { id: 3, order: 3, date: "~3 jul 2026", type: "Long", distance: 10.05, movingSec: 61 * 60 + 42,
    splits: [362, 377, 368, 372, 362, 369, 366, 369, 373, 364], splitDistances: [1,1,1,1,1,1,1,1,1,1],
    elev: [-6, -2, 2, -1, 0, 0, 1, 0, 0, 1] },
  { id: 4, order: 4, date: "6 jul 2026", type: "Long", distance: 9.22, movingSec: 55 * 60 + 22,
    splits: [353, 351, 345, 357, 350, 364, 377, 398, 350, 344], splitDistances: [1,1,1,1,1,1,1,1,1,0.22],
    elev: [7, 3, -46, -14, 0, -4, 0, 39, 15, 0] },
  { id: 5, order: 5, date: "8 jul 2026", type: "Tempo", distance: 7.6, movingSec: 41 * 60 + 25,
    splits: [329, 319, 329, 328, 337, 331, 330, 305], splitDistances: [1,1,1,1,1,1,1,0.6],
    elev: [-16, -18, 12, -1, 36, -5, -9, 7] },
  { id: 6, order: 6, date: "10 jul 2026", type: "Tempo", distance: 5.36, movingSec: 26 * 60 + 5,
    splits: [285, 293, 290, 321, 300, 292], splitDistances: [1,1,1,1,1,0.36],
    elev: [-24, -14, -6, -2, 1, 1], pr: true, note: "5K PR effort — 24:46, 18 Strava PRs" },
];

// ---------- Helpers ----------
function fmtPace(secPerKm) {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
function fmtDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  return h > 0 ? `${h}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}` : `${m}:${s.toString().padStart(2,"0")}`;
}
function avgPace(run) {
  return run.movingSec / run.distance;
}
function daysUntil(dateStr) {
  const target = new Date(dateStr);
  const now = new Date("2026-07-11");
  return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
}
function currentPhase() {
  const now = new Date("2026-07-11");
  const p2 = new Date("2026-08-04");
  const p3 = new Date("2026-09-01");
  if (now < p2) return { n: 1, label: "Base Build", desc: "Long run groeit langzaam. Tempo/interval bouwt surges in." };
  if (now < p3) return { n: 2, label: "Football-Specific Sharpening", desc: "Intervallen worden prioriteit. Long run blijft stabiel." };
  return { n: 3, label: "16K Peak & Taper", desc: "Focus op long run, piek rond 13 sept, daarna taper." };
}
function typeColor(type) {
  if (type === "Long") return C.chalk;
  if (type === "Tempo") return C.red;
  if (type === "Interval") return C.gold;
  return C.chalkDim;
}

// ---------- Split Ladder (signature element) ----------
function SplitLadder({ run }) {
  const maxSplit = Math.max(...run.splits);
  const minSplit = Math.min(...run.splits);
  const range = maxSplit - minSplit || 1;
  const maxElev = Math.max(...run.elev.map(Math.abs), 1);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 180, position: "relative", padding: "0 4px" }}>
        {/* elevation squiggle backdrop */}
        <svg
          width="100%"
          height="60"
          viewBox={`0 0 ${run.splits.length * 100} 60`}
          preserveAspectRatio="none"
          style={{ position: "absolute", bottom: 0, left: 0, opacity: 0.25 }}
        >
          <polyline
            points={run.elev.map((e, i) => {
              const x = i * 100 + 50;
              const y = 30 - (e / maxElev) * 25;
              return `${x},${y}`;
            }).join(" ")}
            fill="none"
            stroke={C.gold}
            strokeWidth="2"
          />
        </svg>
        {run.splits.map((split, i) => {
          const heightPct = 25 + ((maxSplit - split) / range) * 75;
          const isFastest = split === minSplit;
          const isSlowest = split === maxSplit && run.splits.length > 1;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", position: "relative", zIndex: 1 }}>
              <div style={{ fontFamily: monoFont, fontSize: 11, color: isFastest ? C.gold : C.chalkDim, marginBottom: 4, fontVariantNumeric: "tabular-nums" }}>
                {fmtPace(split / run.splitDistances[i])}
              </div>
              <div
                style={{
                  width: "100%",
                  maxWidth: 34,
                  height: `${heightPct}%`,
                  background: isFastest ? C.gold : isSlowest ? C.slate : C.red,
                  borderRadius: "2px 2px 0 0",
                  transition: "height 0.3s ease",
                }}
              />
              <div style={{ fontFamily: monoFont, fontSize: 10, color: C.chalkDim, marginTop: 6 }}>
                {i + 1}
              </div>
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

// ---------- Stat Card ----------
function StatCard({ label, value, unit, accent }) {
  return (
    <div style={{ background: C.panel, borderRadius: 8, padding: "16px 18px", flex: "1 1 140px", borderLeft: `3px solid ${accent || C.slate}` }}>
      <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.chalkDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: monoFont, fontSize: 24, color: C.chalk, fontVariantNumeric: "tabular-nums" }}>
        {value}
        {unit && <span style={{ fontSize: 13, color: C.chalkDim, marginLeft: 4 }}>{unit}</span>}
      </div>
    </div>
  );
}

// ---------- Countdown Lane ----------
function CountdownLane({ title, dateLabel, days, color, sub }) {
  return (
    <div style={{ flex: 1, background: C.panel, borderRadius: 8, padding: "18px 20px", borderTop: `3px solid ${color}`, minWidth: 220 }}>
      <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.chalkDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 42, color: C.chalk, letterSpacing: "0.02em" }}>
          {days}
        </div>
        <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.chalkDim }}>dagen</div>
      </div>
      <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.chalkDim, marginTop: 4 }}>{dateLabel}</div>
      {sub && <div style={{ fontFamily: bodyFont, fontSize: 11, color, marginTop: 8 }}>{sub}</div>}
    </div>
  );
}

// ---------- Add Run Form ----------
function AddRunModal({ onClose, onSave, nextOrder }) {
  const [type, setType] = useState("Long");
  const [distance, setDistance] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [splitsInput, setSplitsInput] = useState("");
  const [note, setNote] = useState("");

  const handleSave = () => {
    const dist = parseFloat(distance);
    const mvSec = (parseInt(minutes || 0) * 60) + parseInt(seconds || 0);
    if (!dist || !mvSec) return;

    let splits = [];
    let splitDistances = [];
    if (splitsInput.trim()) {
      const parts = splitsInput.split(",").map(s => s.trim()).filter(Boolean);
      parts.forEach((p, i) => {
        const [m, s] = p.split(":").map(Number);
        splits.push(m * 60 + s);
        splitDistances.push(1);
      });
      if (splitDistances.length) {
        const totalFullKm = Math.floor(dist);
        const remainder = +(dist - totalFullKm).toFixed(2);
        if (remainder > 0 && splitDistances.length > totalFullKm) {
          splitDistances[splitDistances.length - 1] = remainder;
        }
      }
    } else {
      splits = [mvSec];
      splitDistances = [dist];
    }

    onSave({
      id: Date.now(),
      order: nextOrder,
      date: "vandaag",
      type,
      distance: dist,
      movingSec: mvSec,
      splits,
      splitDistances,
      elev: splits.map(() => 0),
      note: note || undefined,
    });
    onClose();
  };

  const inputStyle = {
    width: "100%",
    background: C.ink,
    border: `1px solid ${C.slate}`,
    borderRadius: 6,
    padding: "10px 12px",
    color: C.chalk,
    fontFamily: bodyFont,
    fontSize: 14,
    marginBottom: 14,
    boxSizing: "border-box",
  };
  const labelStyle = { fontFamily: bodyFont, fontSize: 11, color: C.chalkDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "block" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div style={{ background: C.panel, borderRadius: 10, padding: 28, width: "100%", maxWidth: 420, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 20, color: C.chalk, letterSpacing: "0.03em" }}>NIEUWE RUN</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.chalkDim }}>
            <X size={20} />
          </button>
        </div>

        <label style={labelStyle}>Type</label>
        <select value={type} onChange={e => setType(e.target.value)} style={inputStyle}>
          <option>Long</option>
          <option>Tempo</option>
          <option>Interval</option>
          <option>Test</option>
        </select>

        <label style={labelStyle}>Afstand (km)</label>
        <input type="number" step="0.01" value={distance} onChange={e => setDistance(e.target.value)} style={inputStyle} placeholder="bv. 8.5" />

        <label style={labelStyle}>Moving time</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="number" value={minutes} onChange={e => setMinutes(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} placeholder="min" />
          <input type="number" value={seconds} onChange={e => setSeconds(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} placeholder="sec" />
        </div>
        <div style={{ height: 14 }} />

        <label style={labelStyle}>Splits per km (optioneel, bv. 5:41, 6:32, 6:16)</label>
        <input value={splitsInput} onChange={e => setSplitsInput(e.target.value)} style={inputStyle} placeholder="5:41, 6:32, 6:16, ..." />

        <label style={labelStyle}>Notitie (optioneel)</label>
        <input value={note} onChange={e => setNote(e.target.value)} style={inputStyle} placeholder="bv. nieuwe PR, regen, ..." />

        <button
          onClick={handleSave}
          style={{
            width: "100%",
            background: C.red,
            border: "none",
            borderRadius: 6,
            padding: "12px",
            color: C.chalk,
            fontFamily: displayFont,
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: "0.05em",
            cursor: "pointer",
            marginTop: 6,
          }}
        >
          RUN OPSLAAN
        </button>
      </div>
    </div>
  );
}

// ---------- Main App ----------
export default function RunningCoachDashboard() {
  const [runs, setRuns] = useState(seedRuns);
  const [loaded, setLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [expandedRun, setExpandedRun] = useState(null);
  const [selectedRunId, setSelectedRunId] = useState(6);

  // load from storage
  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get("runs");
        if (result && result.value) {
          const parsed = JSON.parse(result.value);
          if (Array.isArray(parsed) && parsed.length) {
            setRuns(parsed);
            setSelectedRunId(parsed[parsed.length - 1].id);
          }
        }
      } catch (e) {
        // no saved data yet, seed will be used
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // persist on change (after initial load)
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await window.storage.set("runs", JSON.stringify(runs));
      } catch (e) {
        console.error("Storage error", e);
      }
    })();
  }, [runs, loaded]);

  const sortedRuns = useMemo(() => [...runs].sort((a, b) => a.order - b.order), [runs]);
  const selectedRun = runs.find(r => r.id === selectedRunId) || sortedRuns[sortedRuns.length - 1];

  const handleAddRun = (newRun) => {
    setRuns(prev => [...prev, { ...newRun, order: prev.length + 1 }]);
    setSelectedRunId(newRun.id);
  };

  const phase = currentPhase();
  const footballDays = daysUntil("2026-09-01");
  const sixteenKDays = daysUntil("2026-09-20");

  const chartData = sortedRuns.map(r => ({
    name: `#${r.order}`,
    pace: +(avgPace(r) / 60).toFixed(2),
    type: r.type,
  }));

  const longRuns = runs.filter(r => r.type === "Long");
  const tempoRuns = runs.filter(r => r.type === "Tempo");
  const intervalRuns = runs.filter(r => r.type === "Interval");

  const easyPace = longRuns.length ? longRuns.reduce((a, r) => a + avgPace(r), 0) / longRuns.length : null;
  const tempoPace = tempoRuns.length ? Math.min(...tempoRuns.map(avgPace)) : null;
  const intervalPace = intervalRuns.length ? Math.min(...intervalRuns.map(avgPace)) : null;

  // Riegel projection from fastest quality effort
  const qualityRuns = runs.filter(r => r.type === "Tempo" || r.type === "Interval" || r.type === "Test");
  const bestEffort = qualityRuns.reduce((best, r) => (!best || avgPace(r) < avgPace(best)) ? r : best, null);
  const riegel = (targetKm) => {
    if (!bestEffort) return null;
    const t2 = bestEffort.movingSec * Math.pow(targetKm / bestEffort.distance, 1.06);
    return t2;
  };

  return (
    <div style={{ background: C.ink, minHeight: "100%", fontFamily: bodyFont, padding: "28px 20px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.red, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6 }}>
            Running Coach — Trainingslog
          </div>
          <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 30, color: C.chalk, letterSpacing: "0.01em", display: "flex", alignItems: "center", gap: 10 }}>
            FASE {phase.n} · {phase.label.toUpperCase()}
          </div>
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.chalkDim, marginTop: 4 }}>{phase.desc}</div>
        </div>

        {/* Countdown lanes */}
        <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
          <CountdownLane title="⚽ Football-ready (hoofddoel)" dateLabel="1 september 2026" days={footballDays} color={C.red} sub="Prioriteit bij conflict met Doel 2" />
          <CountdownLane title="🏁 16K run" dateLabel="20 september 2026" days={sixteenKDays} color={C.slate} sub="Piek ~14-15km rond 13 sept" />
        </div>

        {/* Fitness stat cards */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
          <StatCard label="Easy pace" value={easyPace ? fmtPace(easyPace) : "—"} unit="/km" accent={C.chalk} />
          <StatCard label="Tempo pace" value={tempoPace ? fmtPace(tempoPace) : "—"} unit="/km" accent={C.red} />
          <StatCard label="Interval pace" value={intervalPace ? fmtPace(intervalPace) : "—"} unit="/km" accent={C.gold} />
          <StatCard label="Est. 5K" value={riegel(5) ? fmtDuration(riegel(5)) : "—"} accent={C.slate} />
          <StatCard label="Est. 10K" value={riegel(10) ? fmtDuration(riegel(10)) : "—"} accent={C.slate} />
          <StatCard label="Est. Half" value={riegel(21.1) ? fmtDuration(riegel(21.1)) : "—"} accent={C.slate} />
        </div>

        {/* Signature: Split Ladder */}
        <div style={{ background: C.panelLight, borderRadius: 10, padding: 22, marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 18, color: C.chalk, letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: 8 }}>
                <Timer size={18} color={C.red} /> SPLIT LADDER
              </div>
              <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.chalkDim, marginTop: 2 }}>
                Run #{selectedRun.order} · {selectedRun.type} · {selectedRun.distance} km · {selectedRun.date}
                {selectedRun.pr && <span style={{ color: C.gold, marginLeft: 8 }}>★ PR</span>}
              </div>
            </div>
            <select
              value={selectedRunId}
              onChange={e => setSelectedRunId(Number(e.target.value))}
              style={{ background: C.ink, border: `1px solid ${C.slate}`, borderRadius: 6, color: C.chalk, padding: "8px 12px", fontFamily: monoFont, fontSize: 13 }}
            >
              {sortedRuns.map(r => (
                <option key={r.id} value={r.id}>Run #{r.order} — {r.type} ({r.distance}km)</option>
              ))}
            </select>
          </div>
          <SplitLadder run={selectedRun} />
          {selectedRun.note && (
            <div style={{ marginTop: 14, fontFamily: bodyFont, fontSize: 12, color: C.chalkDim, borderTop: `1px solid ${C.slate}`, paddingTop: 12 }}>
              {selectedRun.note}
            </div>
          )}
        </div>

        {/* Trend chart */}
        <div style={{ background: C.panel, borderRadius: 10, padding: 22, marginBottom: 28 }}>
          <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 18, color: C.chalk, letterSpacing: "0.03em", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={18} color={C.red} /> PACE-ONTWIKKELING
          </div>
          <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.chalkDim, marginBottom: 16 }}>Gemiddelde pace per run (lager = sneller)</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ left: -10, right: 10 }}>
              <CartesianGrid stroke={C.slate} strokeOpacity={0.3} vertical={false} />
              <XAxis dataKey="name" stroke={C.chalkDim} tick={{ fontFamily: monoFont, fontSize: 11 }} />
              <YAxis
                stroke={C.chalkDim}
                tick={{ fontFamily: monoFont, fontSize: 11 }}
                reversed
                tickFormatter={v => `${v.toFixed(1)}`}
                width={35}
              />
              <Tooltip
                contentStyle={{ background: C.ink, border: `1px solid ${C.slate}`, borderRadius: 6, fontFamily: monoFont, fontSize: 12 }}
                labelStyle={{ color: C.chalkDim }}
                formatter={(value, name, props) => [`${fmtPace(value * 60)}/km`, props.payload.type]}
              />
              <Line type="monotone" dataKey="pace" stroke={C.red} strokeWidth={2} dot={{ fill: C.gold, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Run log */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 18, color: C.chalk, letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: 8 }}>
              <Flag size={18} color={C.red} /> RUN LOG
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: C.red, border: "none", borderRadius: 6, padding: "8px 14px", color: C.chalk, fontFamily: displayFont, fontWeight: 700, fontSize: 13, letterSpacing: "0.05em", cursor: "pointer" }}
            >
              <Plus size={15} /> NIEUWE RUN
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[...sortedRuns].reverse().map(run => (
              <div key={run.id}>
                <div
                  onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: C.panel,
                    padding: "12px 16px",
                    borderRadius: expandedRun === run.id ? "6px 6px 0 0" : 6,
                    cursor: "pointer",
                    borderLeft: `3px solid ${typeColor(run.type)}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: monoFont, fontSize: 12, color: C.chalkDim, width: 30 }}>#{run.order}</span>
                    <span style={{ fontFamily: bodyFont, fontSize: 13, color: C.chalk, fontWeight: 600, minWidth: 60 }}>{run.type}</span>
                    <span style={{ fontFamily: bodyFont, fontSize: 12, color: C.chalkDim }}>{run.date}</span>
                    {run.pr && <span style={{ fontFamily: bodyFont, fontSize: 11, color: C.gold }}>★ PR</span>}
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
                    <SplitLadder run={run} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.chalkDim, textAlign: "center", marginTop: 20, opacity: 0.7 }}>
          Data wordt lokaal bewaard bij dit artifact — voeg nieuwe runs toe met de knop hierboven.
        </div>
      </div>

      {showModal && (
        <AddRunModal
          onClose={() => setShowModal(false)}
          onSave={handleAddRun}
          nextOrder={runs.length + 1}
        />
      )}
    </div>
  );
}
