import { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, X, ChevronDown, ChevronUp, Timer, Flag, TrendingUp, RefreshCw, LayoutDashboard, ClipboardList, Activity, Award } from "lucide-react";
import { analyzeRun, avgPace } from "./utils/analysis.js";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

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
const ZONE_COLORS = ["#3A4964", "#4C6785", "#D9A544", "#E08A2B", "#C81D25"];

const displayFont = "'Arial Narrow', 'Helvetica Neue', Arial, sans-serif";
const bodyFont = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const monoFont = "'SF Mono', 'Roboto Mono', Menlo, Consolas, monospace";

// ---------- Helpers ----------
function fmtPace(secPerKm) {
  if (!secPerKm || !isFinite(secPerKm)) return "—";
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
function fmtDuration(sec) {
  if (!sec || !isFinite(sec)) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`;
}
function fmtDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}
function fmtPaceDelta(deltaSec) {
  if (deltaSec === undefined) return "—";
  const sign = deltaSec <= 0 ? "−" : "+";
  return `${sign}${Math.abs(Math.round(deltaSec))}s/km`;
}
function fmtKm(meters) {
  if (!meters) return "0";
  return (meters / 1000).toFixed(1);
}
function daysUntil(dateStr) {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
}
function currentPhase() {
  const now = new Date();
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

// ---------- Split Ladder ----------
function SplitLadder({ run }) {
  if (!run.splits || run.splits.length === 0) {
    return <div style={{ color: C.chalkDim, fontFamily: bodyFont, fontSize: 13 }}>Geen split-data voor deze run.</div>;
  }
  const maxSplit = Math.max(...run.splits);
  const minSplit = Math.min(...run.splits);
  const range = maxSplit - minSplit || 1;
  const elev = run.elev && run.elev.length === run.splits.length ? run.elev : run.splits.map(() => 0);
  const maxElev = Math.max(...elev.map(Math.abs), 1);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 180, position: "relative", padding: "0 4px" }}>
        <svg width="100%" height="60" viewBox={`0 0 ${run.splits.length * 100} 60`} preserveAspectRatio="none" style={{ position: "absolute", bottom: 0, left: 0, opacity: 0.25 }}>
          <polyline points={elev.map((e, i) => `${i * 100 + 50},${30 - (e / maxElev) * 25}`).join(" ")} fill="none" stroke={C.gold} strokeWidth="2" />
        </svg>
        {run.splits.map((split, i) => {
          const dist = (run.splitDistances && run.splitDistances[i]) || 1;
          const heightPct = 25 + ((maxSplit - split) / range) * 75;
          const isFastest = split === minSplit;
          const isSlowest = split === maxSplit && run.splits.length > 1;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", position: "relative", zIndex: 1 }}>
              <div style={{ fontFamily: monoFont, fontSize: 11, color: isFastest ? C.gold : C.chalkDim, marginBottom: 4, fontVariantNumeric: "tabular-nums" }}>{fmtPace(split / dist)}</div>
              <div style={{ width: "100%", maxWidth: 34, height: `${heightPct}%`, background: isFastest ? C.gold : isSlowest ? C.slate : C.red, borderRadius: "2px 2px 0 0", transition: "height 0.3s ease" }} />
              <div style={{ fontFamily: monoFont, fontSize: 10, color: C.chalkDim, marginTop: 6 }}>{i + 1}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: bodyFont, fontSize: 11, color: C.chalkDim }}>
        <span>KM →</span><span style={{ color: C.gold }}>● snelste split</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, accent, sub }) {
  return (
    <div style={{ background: C.panel, borderRadius: 8, padding: "16px 18px", flex: "1 1 140px", borderLeft: `3px solid ${accent || C.slate}` }}>
      <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.chalkDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: monoFont, fontSize: 24, color: C.chalk, fontVariantNumeric: "tabular-nums" }}>
        {value}{unit && <span style={{ fontSize: 13, color: C.chalkDim, marginLeft: 4 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontFamily: bodyFont, fontSize: 10, color: C.chalkDim, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function CountdownLane({ title, dateLabel, days, color, sub }) {
  return (
    <div style={{ flex: 1, background: C.panel, borderRadius: 8, padding: "18px 20px", borderTop: `3px solid ${color}`, minWidth: 220 }}>
      <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.chalkDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{title}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 42, color: C.chalk, letterSpacing: "0.02em" }}>{days}</div>
        <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.chalkDim }}>dagen</div>
      </div>
      <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.chalkDim, marginTop: 4 }}>{dateLabel}</div>
      {sub && <div style={{ fontFamily: bodyFont, fontSize: 11, color, marginTop: 8 }}>{sub}</div>}
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div style={{ background: C.panel, borderRadius: 10, padding: 22, marginBottom: 20 }}>
      <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 16, color: C.chalk, letterSpacing: "0.03em", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>{icon} {title}</div>
      {children}
    </div>
  );
}

function FeedbackRow({ tone, text }) {
  const color = tone === "positive" ? C.gold : tone === "warning" ? C.red : C.slate;
  return <div style={{ borderLeft: `3px solid ${color}`, paddingLeft: 12, marginBottom: 10, fontFamily: bodyFont, fontSize: 13, color: C.chalk, lineHeight: 1.5 }}>{text}</div>;
}

function Badge({ children, color }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${color}22`, color, border: `1px solid ${color}55`, borderRadius: 20, padding: "3px 10px", fontFamily: bodyFont, fontSize: 12, fontWeight: 600 }}>
      {children}
    </span>
  );
}

// zone labels — generic 5-zone HR model
const ZONE_LABELS = ["Z1 Herstel", "Z2 Aeroob", "Z3 Tempo", "Z4 Drempel", "Z5 Max"];

function ZoneBar({ zoneSummary }) {
  if (!zoneSummary || !zoneSummary.length) {
    return <div style={{ color: C.chalkDim, fontFamily: bodyFont, fontSize: 13 }}>Geen hartslagzone-data beschikbaar voor deze run.</div>;
  }
  return (
    <div>
      <div style={{ display: "flex", width: "100%", height: 28, borderRadius: 6, overflow: "hidden", marginBottom: 10 }}>
        {zoneSummary.map((z, i) => (
          <div key={i} style={{ width: `${z.pct}%`, background: ZONE_COLORS[i % ZONE_COLORS.length] }} title={`${ZONE_LABELS[i] || `Zone ${z.zone}`}: ${z.pct.toFixed(0)}%`} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {zoneSummary.map((z, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: bodyFont, fontSize: 12, color: C.chalkDim }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: ZONE_COLORS[i % ZONE_COLORS.length], display: "inline-block" }} />
            {ZONE_LABELS[i] || `Zone ${z.zone}`}: {z.pct.toFixed(0)}% ({fmtDuration(z.seconds)})
          </div>
        ))}
      </div>
    </div>
  );
}

function BestEffortsTable({ bestEfforts }) {
  const rows = [
    { label: "1K", effort: bestEfforts.best1k },
    { label: "1 mijl", effort: bestEfforts.bestMile },
    { label: "5K", effort: bestEfforts.best5k },
    { label: "10K", effort: bestEfforts.best10k },
    { label: "Halve marathon", effort: bestEfforts.bestHalf },
  ].filter((r) => r.effort);

  if (!rows.length) {
    return <div style={{ color: C.chalkDim, fontFamily: bodyFont, fontSize: 13 }}>Geen best-effort tijden van Strava beschikbaar binnen deze run.</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontFamily: bodyFont, fontSize: 13, color: C.chalk, padding: "6px 0", borderBottom: i < rows.length - 1 ? `1px solid ${C.slate}44` : "none" }}>
          <span>{r.label}</span>
          <span style={{ fontFamily: monoFont, color: C.gold }}>{fmtDuration(r.effort.movingSec)}{r.effort.prRank ? ` — PR #${r.effort.prRank}` : ""}</span>
        </div>
      ))}
    </div>
  );
}

// ---------- Add Run Modal ----------
function AddRunModal({ onClose, onSave }) {
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

// ---------- Run Analysis Tab ----------
function RunAnalysisTab({ allRuns }) {
  const [selectedRunId, setSelectedRunId] = useState(allRuns.length ? allRuns[allRuns.length - 1].id : null);
  const analysis = useMemo(() => (selectedRunId ? analyzeRun(allRuns, selectedRunId) : null), [allRuns, selectedRunId]);

  if (!allRuns.length) return <div style={{ color: C.chalkDim, fontFamily: bodyFont, padding: 20 }}>Nog geen runs om te analyseren.</div>;
  if (!analysis) return null;

  const { run, pace, elevGain, elevLoss, comparison, splitType, variance, fastestIdx, slowestIdx, finishingKick, terrainFlags, paces, disciplineTrend, disciplineDirection, feedback, fitness, zoneSummary, bestEfforts } = analysis;
  const splitTypeLabel = { positive: "Positieve splits (vertraging)", negative: "Negatieve splits (versnelling)", even: "Gelijkmatige pacing" }[splitType];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <select value={selectedRunId} onChange={(e) => setSelectedRunId(e.target.value)} style={{ background: C.panel, border: `1px solid ${C.slate}`, borderRadius: 6, color: C.chalk, padding: "8px 12px", fontFamily: monoFont, fontSize: 13 }}>
          {[...allRuns].sort((a, b) => new Date(a.date) - new Date(b.date)).map((r, i) => (
            <option key={r.id} value={r.id}>Run #{i + 1} — {r.type} ({r.distance}km) — {fmtDate(r.date)}</option>
          ))}
        </select>
      </div>

      <Section title="RUN SAMENVATTING" icon={<Timer size={16} color={C.red} />}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {run.prCount > 0 && <Badge color={C.gold}><Award size={12} /> {run.prCount} PR{run.prCount > 1 ? "'s" : ""}</Badge>}
          {run.sufferScore != null && <Badge color={C.red}><Activity size={12} /> Relative Effort: {run.sufferScore}</Badge>}
          {run.achievementCount > 0 && <Badge color={C.chalkDim}>{run.achievementCount} prestaties</Badge>}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <StatCard label="Type" value={run.type} accent={typeColor(run.type)} />
          <StatCard label="Afstand" value={run.distance} unit="km" accent={C.chalk} />
          <StatCard label="Pace" value={fmtPace(pace)} unit="/km" accent={C.red} />
          <StatCard label="Duur" value={fmtDuration(run.movingSec)} accent={C.chalk} />
          <StatCard label="Hoogtewinst" value={`+${Math.round(elevGain)}`} unit="m" accent={C.gold} />
          <StatCard label="Hoogteverlies" value={`−${Math.round(elevLoss)}`} unit="m" accent={C.slate} />
        </div>
        {run.note && <div style={{ marginTop: 14, fontFamily: bodyFont, fontSize: 13, color: C.chalkDim, fontStyle: "italic" }}>"{run.note}"</div>}
      </Section>

      <Section title="VERGELIJKING MET VORIGE RUNS" icon={<TrendingUp size={16} color={C.red} />}>
        {comparison.sampleSize === 0 ? (
          <div style={{ color: C.chalkDim, fontFamily: bodyFont, fontSize: 13 }}>Dit is je eerste gelogde run — nog geen geschiedenis om mee te vergelijken.</div>
        ) : (
          <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.chalk, lineHeight: 1.7 }}>
            <p>
              Vergeleken met je {comparison.sameTypeSampleSize} eerdere {run.type.toLowerCase()}-run(s):{" "}
              {comparison.isPR ? (
                <span style={{ color: C.gold, fontWeight: 600 }}>dit is je snelste tot nu toe ({fmtPaceDelta(comparison.paceDeltaVsBest)} t.o.v. je vorige beste).</span>
              ) : (
                <span>{fmtPaceDelta(comparison.paceDeltaVsAvg)} t.o.v. je gemiddelde {run.type.toLowerCase()}-pace.</span>
              )}
            </p>
            {comparison.isLongestDistance && <p style={{ color: C.gold }}>Dit is ook je langste run tot nu toe ({run.distance}km, vorige langste was {comparison.longestPrevDistance}km).</p>}
            <p>Algemene trend over je laatste runs: <span style={{ color: comparison.overallTrend === "verbeterend" ? C.gold : comparison.overallTrend === "vertragend" ? C.red : C.chalkDim, fontWeight: 600 }}>{comparison.overallTrend}</span></p>
          </div>
        )}
      </Section>

      <Section title="SPLIT & PACING ANALYSE" icon={<Flag size={16} color={C.red} />}>
        <SplitLadder run={run} />
        <div style={{ marginTop: 16, fontFamily: bodyFont, fontSize: 13, color: C.chalk, lineHeight: 1.7 }}>
          <p><strong style={{ color: C.chalk }}>{splitTypeLabel}</strong> — variantie tussen splits: {Math.round(variance)}s.</p>
          {fastestIdx >= 0 && <p>Snelste km: #{fastestIdx + 1} ({fmtPace(paces[fastestIdx])}/km){terrainFlags[fastestIdx] === "downhill-aided" && <span style={{ color: C.chalkDim }}> — deels geholpen door afdalend terrein</span>}.</p>}
          {slowestIdx >= 0 && <p>Langzaamste km: #{slowestIdx + 1} ({fmtPace(paces[slowestIdx])}/km){terrainFlags[slowestIdx] === "uphill-slowed" && <span style={{ color: C.chalkDim }}> — deels verklaard door een klim</span>}.</p>}
          <p>{finishingKick < -5 ? "Sterke eindsprint in de laatste kilometer." : finishingKick > 10 ? "Duidelijke vertraging in de laatste kilometer." : "Stabiel gehouden richting het einde."}</p>
        </div>
      </Section>

      <Section title="INSPANNING & HARTSLAGZONES" icon={<Activity size={16} color={C.red} />}>
        <ZoneBar zoneSummary={zoneSummary} />
        <div style={{ marginTop: 18, borderTop: `1px solid ${C.slate}`, paddingTop: 16 }}>
          <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.chalkDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Best efforts binnen deze run (Strava)</div>
          <BestEffortsTable bestEfforts={bestEfforts} />
        </div>
      </Section>

      <Section title="TRENDS" icon={<TrendingUp size={16} color={C.red} />}>
        {disciplineTrend.length < 2 ? (
          <div style={{ color: C.chalkDim, fontFamily: bodyFont, fontSize: 13 }}>Nog niet genoeg runs voor een trendanalyse.</div>
        ) : (
          <>
            <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.chalk, marginBottom: 12 }}>
              Pacing-discipline over je laatste runs is <span style={{ color: disciplineDirection === "verbeterend" ? C.gold : disciplineDirection === "verslechterend" ? C.red : C.chalkDim, fontWeight: 600 }}>{disciplineDirection}</span>.
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 60 }}>
              {disciplineTrend.map((d) => {
                const maxVar = Math.max(...disciplineTrend.map((x) => x.variance), 1);
                return (
                  <div key={d.order} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ height: `${20 + (d.variance / maxVar) * 40}px`, background: d.isCurrent ? C.gold : C.slate, borderRadius: "2px 2px 0 0" }} />
                    <div style={{ fontFamily: monoFont, fontSize: 10, color: C.chalkDim, marginTop: 4 }}>#{d.order}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Section>

      <Section title="COACHING FEEDBACK" icon={<ClipboardList size={16} color={C.red} />}>
        {feedback.length === 0 ? <div style={{ color: C.chalkDim, fontFamily: bodyFont, fontSize: 13 }}>Geen bijzonderheden — een solide, gemiddelde inspanning.</div> : feedback.map((f, i) => <FeedbackRow key={i} tone={f.tone} text={f.text} />)}
      </Section>

      <Section title="BIJGEWERKTE FITNESS-INSCHATTING" icon={<Timer size={16} color={C.red} />}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <StatCard label="Easy pace" value={fitness.easyPace ? fmtPace(fitness.easyPace) : "—"} unit="/km" accent={C.chalk} />
          <StatCard label="Tempo pace" value={fitness.tempoPace ? fmtPace(fitness.tempoPace) : "—"} unit="/km" accent={C.red} />
          <StatCard label="Interval pace" value={fitness.intervalPace ? fmtPace(fitness.intervalPace) : "—"} unit="/km" accent={C.gold} />
          <StatCard label="5K" value={fmtDuration(fitness.est5k)} accent={C.slate} sub={fitness.est5kSource === "strava" ? "★ gemeten (Strava)" : "geschat (Riegel)"} />
          <StatCard label="10K" value={fmtDuration(fitness.est10k)} accent={C.slate} sub={fitness.est10kSource === "strava" ? "★ gemeten (Strava)" : "geschat (Riegel)"} />
          <StatCard label="Half" value={fmtDuration(fitness.estHalf)} accent={C.slate} sub={fitness.estHalfSource === "strava" ? "★ gemeten (Strava)" : "geschat (Riegel)"} />
        </div>
      </Section>
    </div>
  );
}

// ---------- Dashboard Tab ----------
function DashboardTab({ allRuns, onShowModal }) {
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
        <CountdownLane title="⚽ Football-ready (hoofddoel)" dateLabel="1 september 2026" days={footballDays} color={C.red} sub="Prioriteit bij conflict met Doel 2" />
        <CountdownLane title="🏁 16K run" dateLabel="20 september 2026" days={sixteenKDays} color={C.slate} sub="Piek ~14-15km rond 13 sept" />
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
        <StatCard label="Easy pace" value={easyPace ? fmtPace(easyPace) : "—"} unit="/km" accent={C.chalk} />
        <StatCard label="Tempo pace" value={tempoPace ? fmtPace(tempoPace) : "—"} unit="/km" accent={C.red} />
        <StatCard label="Interval pace" value={intervalPace ? fmtPace(intervalPace) : "—"} unit="/km" accent={C.gold} />
        <StatCard label="Est. 5K" value={fmtDuration(riegel(5))} accent={C.slate} />
        <StatCard label="Est. 10K" value={fmtDuration(riegel(10))} accent={C.slate} />
        <StatCard label="Est. Half" value={fmtDuration(riegel(21.1))} accent={C.slate} />
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
          <SplitLadder run={selectedRun} />
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
              <div onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.panel, padding: "12px 16px", borderRadius: expandedRun === run.id ? "6px 6px 0 0" : 6, cursor: "pointer", borderLeft: `3px solid ${typeColor(run.type)}`, flexWrap: "wrap", gap: 8 }}>
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
                  <SplitLadder run={run} />
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

// ---------- Statistieken Tab ----------
function StatsTotalsRow({ label, totals }) {
  if (!totals) return null;
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
      <StatCard label={`${label} — runs`} value={totals.count ?? 0} accent={C.chalk} />
      <StatCard label={`${label} — afstand`} value={fmtKm(totals.distance)} unit="km" accent={C.red} />
      <StatCard label={`${label} — tijd`} value={fmtDuration(totals.moving_time)} accent={C.gold} />
      <StatCard label={`${label} — hoogtemeters`} value={Math.round(totals.elevation_gain || 0)} unit="m" accent={C.slate} />
    </div>
  );
}

function StatistiekenTab({ connected }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/athlete/stats`);
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!connected) {
    return <div style={{ color: C.chalkDim, fontFamily: bodyFont, padding: 20 }}>Verbind eerst met Strava om je statistieken te zien.</div>;
  }
  if (loading) return <div style={{ color: C.chalkDim, fontFamily: bodyFont, padding: 20 }}>Laden...</div>;
  if (!stats || !stats.stats) return <div style={{ color: C.chalkDim, fontFamily: bodyFont, padding: 20 }}>Nog geen statistieken — klik op "Ververs Strava" om ze op te halen.</div>;

  const s = stats.stats;

  return (
    <div>
      <Section title="LAATSTE 4 WEKEN" icon={<TrendingUp size={16} color={C.red} />}>
        <StatsTotalsRow label="4 weken" totals={s.recent_run_totals} />
      </Section>
      <Section title="DIT JAAR (YTD)" icon={<Flag size={16} color={C.red} />}>
        <StatsTotalsRow label="YTD" totals={s.ytd_run_totals} />
      </Section>
      <Section title="ALL-TIME" icon={<Award size={16} color={C.red} />}>
        <StatsTotalsRow label="All-time" totals={s.all_run_totals} />
      </Section>
      {stats.updatedAt && (
        <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.chalkDim, textAlign: "center", marginTop: 10 }}>
          Bijgewerkt: {new Date(stats.updatedAt).toLocaleString("nl-NL")} — ververs via de knop bovenaan om opnieuw op te halen.
        </div>
      )}
    </div>
  );
}

// ---------- Main App ----------
export default function App() {
  const [runs, setRuns] = useState([]);
  const [manualRuns, setManualRuns] = useState([]);
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    checkStatus();
    loadRuns();
    if (new URLSearchParams(window.location.search).get("connected")) {
      window.history.replaceState({}, "", "/");
      handleSync();
    }
  }, []);

  async function checkStatus() {
    try {
      const res = await fetch(`${API_BASE}/api/status`);
      const data = await res.json();
      setConnected(data.connected);
    } catch (e) { console.error(e); }
  }

  async function loadRuns() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/runs`);
      const data = await res.json();
      setRuns(data);
    } catch (e) {
      console.error("Failed to load runs", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch(`${API_BASE}/api/sync`, { method: "POST" });
      await loadRuns();
      setConnected(true);
    } catch (e) {
      console.error("Sync failed", e);
    } finally {
      setSyncing(false);
    }
  }

  const allRuns = useMemo(() => {
    const combined = [...runs, ...manualRuns];
    return combined.sort((a, b) => new Date(a.date) - new Date(b.date)).map((r, i) => ({ ...r, order: i + 1 }));
  }, [runs, manualRuns]);

  const phase = currentPhase();

  if (loading) {
    return <div style={{ background: C.ink, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.chalkDim, fontFamily: bodyFont }}>Laden...</div>;
  }

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={15} /> },
    { id: "analysis", label: "Run Analyse", icon: <ClipboardList size={15} /> },
    { id: "stats", label: "Statistieken", icon: <Award size={15} /> },
  ];

  return (
    <div style={{ background: C.ink, minHeight: "100vh", fontFamily: bodyFont, padding: "28px 20px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.red, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6 }}>Running Coach — Trainingslog</div>
            <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 28, color: C.chalk, letterSpacing: "0.01em" }}>FASE {phase.n} · {phase.label.toUpperCase()}</div>
            <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.chalkDim, marginTop: 4 }}>{phase.desc}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {connected ? (
              <button onClick={handleSync} disabled={syncing} style={{ display: "flex", alignItems: "center", gap: 6, background: C.panel, border: `1px solid ${C.slate}`, borderRadius: 6, padding: "8px 14px", color: C.chalk, fontFamily: bodyFont, fontSize: 13, cursor: "pointer" }}>
                <RefreshCw size={14} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
                {syncing ? "Synchroniseren..." : "Ververs Strava"}
              </button>
            ) : (
              <a href={`${API_BASE}/auth/strava`} style={{ display: "flex", alignItems: "center", background: C.red, borderRadius: 6, padding: "8px 14px", color: C.chalk, fontFamily: bodyFont, fontSize: 13, textDecoration: "none" }}>Verbind met Strava</a>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.slate}` }}>
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", padding: "10px 16px", fontFamily: displayFont, fontWeight: 700, fontSize: 13, letterSpacing: "0.04em", color: activeTab === tab.id ? C.chalk : C.chalkDim, borderBottom: activeTab === tab.id ? `2px solid ${C.red}` : "2px solid transparent", marginBottom: -1 }}>
              {tab.icon} {tab.label.toUpperCase()}
            </button>
          ))}
        </div>

        {activeTab === "dashboard" && <DashboardTab allRuns={allRuns} onShowModal={() => setShowModal(true)} />}
        {activeTab === "analysis" && <RunAnalysisTab allRuns={allRuns} />}
        {activeTab === "stats" && <StatistiekenTab connected={connected} />}
      </div>

      {showModal && <AddRunModal onClose={() => setShowModal(false)} onSave={(run) => setManualRuns((prev) => [...prev, run])} />}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
