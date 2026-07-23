import { useState, useMemo } from "react";
import { Timer, Flag, TrendingUp, ClipboardList, Activity, Award, Map, Sparkles, Gauge } from "lucide-react";
import { analyzeRun } from "../utils/analysis.js";
import { fmtPace, fmtDuration, fmtDate, fmtPaceDelta, typeColor } from "../utils/format.js";
import { monoFont } from "../constants.js";
import Section from "../components/Section.jsx";
import StatCard from "../components/StatCard.jsx";
import SplitLadder from "../components/SplitLadder.jsx";
import ZoneBar from "../components/ZoneBar.jsx";
import BestEffortsTable from "../components/BestEffortsTable.jsx";
import FeedbackRow from "../components/FeedbackRow.jsx";
import Badge from "../components/Badge.jsx";
import PaceZonesCard from "../components/PaceZonesCard.jsx";
import RouteMap from "../components/RouteMap.jsx";
import SplitDeviationChart from "../components/SplitDeviationChart.jsx";
import HrSplitChart from "../components/HrSplitChart.jsx";

function PerformanceIndexCard({ pi, C }) {
  const color = pi.score >= 80 ? C.gold : pi.score >= 60 ? C.chalk : C.red;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 110, height: 110, borderRadius: "50%", border: `4px solid ${color}`, flexShrink: 0 }}>
        <div style={{ fontFamily: monoFont, fontSize: 32, fontWeight: 700, color }}>{pi.score}</div>
        <div style={{ fontFamily: monoFont, fontSize: 10, color: C.chalkDim }}>/ 100</div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flex: 1 }}>
        <StatCard label="Pace" value={pi.paceScore} unit="/100" accent={C.red} C={C} />
        <StatCard label="Afstand" value={pi.distanceScore} unit="/100" accent={C.chalk} C={C} />
        <StatCard label="Hartslag" value={pi.hrScore ?? "—"} unit={pi.hrScore != null ? "/100" : undefined} accent={C.gold} C={C} />
        <StatCard label="Consistentie" value={pi.consistencyScore} unit="/100" accent={C.slate} C={C} />
      </div>
    </div>
  );
}

export default function RunAnalysisTab({ allRuns, C }) {
  const [selectedRunId, setSelectedRunId] = useState(allRuns.length ? allRuns[allRuns.length - 1].id : null);
  const analysis = useMemo(() => (selectedRunId ? analyzeRun(allRuns, selectedRunId) : null), [allRuns, selectedRunId]);

  if (!allRuns.length) return <div style={{ color: C.chalkDim, padding: 20 }}>Nog geen runs om te analyseren.</div>;
  if (!analysis) return null;

  const {
    run, pace, elevGain, elevLoss, comparison, splitType, variance, fastestIdx, slowestIdx,
    finishingKick, terrainFlags, paces, disciplineTrend, disciplineDirection, feedback,
    fitness, zoneSummary, bestEfforts, paceZones, paceZonesText, performanceIndex, aiAnalysisText,
  } = analysis;
  const splitTypeLabel = { positive: "Positieve splits (vertraging)", negative: "Negatieve splits (versnelling)", even: "Gelijkmatige pacing" }[splitType];

  return (
    <div>
      {/* Filter: selecteer welke run geanalyseerd wordt */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <select value={selectedRunId} onChange={(e) => setSelectedRunId(e.target.value)} style={{ background: C.panel, border: `1px solid ${C.slate}`, borderRadius: 6, color: C.chalk, padding: "8px 12px", fontFamily: monoFont, fontSize: 13 }}>
          {[...allRuns].sort((a, b) => new Date(a.date) - new Date(b.date)).map((r, i) => (
            <option key={r.id} value={r.id}>Run #{i + 1} — {r.type} ({r.distance}km) — {fmtDate(r.date)}</option>
          ))}
        </select>
      </div>

      {/* KPI: Performance Index */}
      <Section title="PERFORMANCE INDEX" icon={<Gauge size={16} color={C.red} />} C={C}>
        <PerformanceIndexCard pi={performanceIndex} C={C} />
        <div style={{ marginTop: 12, fontSize: 11, color: C.chalkDim }}>
          Gewogen samengestelde score op basis van pace, afstand, hartslag-efficiëntie en pacing-consistentie — een coaching-heuristiek, geen gevalideerde wetenschappelijke maatstaf.
        </div>
      </Section>

      {/* Run Samenvatting */}
      <Section title="RUN SAMENVATTING" icon={<Timer size={16} color={C.red} />} C={C}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {run.prCount > 0 && <Badge color={C.gold}><Award size={12} /> {run.prCount} PR{run.prCount > 1 ? "'s" : ""}</Badge>}
          {comparison.isAllTimeFastest && <Badge color={C.gold}>★ All-Time snelste</Badge>}
          {run.sufferScore != null && <Badge color={C.red}><Activity size={12} /> Relative Effort: {run.sufferScore}</Badge>}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <StatCard label="Type" value={run.type} accent={typeColor(run.type, C)} C={C} />
          <StatCard label="Afstand" value={run.distance} unit="km" accent={C.chalk} C={C} />
          <StatCard label="Gemiddelde pace" value={fmtPace(pace)} unit="/km" accent={C.red} C={C} />
          <StatCard label="Duur (moving time)" value={fmtDuration(run.movingSec)} accent={C.chalk} C={C} />
          <StatCard label="Hoogtewinst" value={`+${Math.round(elevGain)}`} unit="m" accent={C.gold} C={C} />
          <StatCard label="Hoogteverlies" value={`−${Math.round(elevLoss)}`} unit="m" accent={C.slate} C={C} />
        </div>
        {run.note && <div style={{ marginTop: 14, fontSize: 13, color: C.chalkDim, fontStyle: "italic" }}>"{run.note}"</div>}
      </Section>

      {/* Route */}
      <Section title="ROUTE" icon={<Map size={16} color={C.red} />} C={C}>
        <RouteMap route={run.route} C={C} />
      </Section>

      {/* Split Ladder + Pacing Analyse */}
      <Section title="SPLIT LADDER & PACING ANALYSE" icon={<Flag size={16} color={C.red} />} C={C}>
        <SplitLadder run={run} C={C} />
        <div style={{ marginTop: 16, fontSize: 13, color: C.chalk, lineHeight: 1.7 }}>
          <p><strong style={{ color: C.chalk }}>{splitTypeLabel}</strong> — variantie tussen splits: {Math.round(variance)}s.</p>
          {fastestIdx >= 0 && <p>Snelste km: #{fastestIdx + 1} ({fmtPace(paces[fastestIdx])}/km){terrainFlags[fastestIdx] === "downhill-aided" && <span style={{ color: C.chalkDim }}> — deels geholpen door afdalend terrein</span>}.</p>}
          {slowestIdx >= 0 && <p>Langzaamste km: #{slowestIdx + 1} ({fmtPace(paces[slowestIdx])}/km){terrainFlags[slowestIdx] === "uphill-slowed" && <span style={{ color: C.chalkDim }}> — deels verklaard door een klim</span>}.</p>}
          <p>{finishingKick < -5 ? "Sterke eindsprint in de laatste kilometer." : finishingKick > 10 ? "Duidelijke vertraging in de laatste kilometer." : "Stabiel gehouden richting het einde."}</p>
        </div>
      </Section>

      {/* Positive / Negative Split */}
      <Section title="POSITIVE / NEGATIVE SPLIT" icon={<TrendingUp size={16} color={C.red} />} C={C}>
        <SplitDeviationChart paces={paces} C={C} />
      </Section>

      {/* Pace Zones */}
      <Section title="PACE ZONES" icon={<Activity size={16} color={C.red} />} C={C}>
        <PaceZonesCard paceZones={paceZones} insight={paceZonesText} C={C} />
      </Section>

      {/* Hartslag */}
      <Section title="HARTSLAG" icon={<Activity size={16} color={C.red} />} C={C}>
        <HrSplitChart hrSplits={run.hrSplits} C={C} />
        <div style={{ marginTop: 18, borderTop: `1px solid ${C.slate}`, paddingTop: 16 }}>
          <div style={{ fontSize: 12, color: C.chalkDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Hartslagzones (deze run)</div>
          <ZoneBar zoneSummary={zoneSummary} C={C} />
        </div>
        <div style={{ marginTop: 18, borderTop: `1px solid ${C.slate}`, paddingTop: 16 }}>
          <div style={{ fontSize: 12, color: C.chalkDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Best efforts binnen deze run (Strava)</div>
          <BestEffortsTable bestEfforts={bestEfforts} C={C} />
        </div>
      </Section>

      {/* Coaching Feedback */}
      <Section title="COACHING FEEDBACK" icon={<ClipboardList size={16} color={C.red} />} C={C}>
        {feedback.length === 0 ? <div style={{ color: C.chalkDim, fontSize: 13 }}>Geen bijzonderheden — een solide, gemiddelde inspanning.</div> : feedback.map((f, i) => <FeedbackRow key={i} tone={f.tone} text={f.text} C={C} />)}
      </Section>

      {/* AI Analysis */}
      <Section title="AI ANALYSIS" icon={<Sparkles size={16} color={C.red} />} C={C}>
        <div style={{ fontSize: 13, color: C.chalk, lineHeight: 1.7 }}>{aiAnalysisText}</div>
        <div style={{ marginTop: 10, fontSize: 11, color: C.chalkDim }}>Automatisch gegenereerd op basis van vaste regels — geen live AI-model.</div>
      </Section>

      {/* Vergelijking met vorige runs / trends */}
      <Section title="VERGELIJKING MET VORIGE RUNS" icon={<TrendingUp size={16} color={C.red} />} C={C}>
        {comparison.sampleSize === 0 ? (
          <div style={{ color: C.chalkDim, fontSize: 13 }}>Dit is je eerste gelogde run — nog geen geschiedenis om mee te vergelijken.</div>
        ) : (
          <div style={{ fontSize: 13, color: C.chalk, lineHeight: 1.7 }}>
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
        {disciplineTrend.length >= 2 && (
          <div style={{ marginTop: 16, borderTop: `1px solid ${C.slate}`, paddingTop: 16 }}>
            <div style={{ fontSize: 13, color: C.chalk, marginBottom: 12 }}>
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
          </div>
        )}
      </Section>

      {/* Fitness snapshot (bestond al) */}
      <Section title="BIJGEWERKTE FITNESS-INSCHATTING" icon={<Timer size={16} color={C.red} />} C={C}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <StatCard label="Easy pace" value={fitness.easyPace ? fmtPace(fitness.easyPace) : "—"} unit="/km" accent={C.chalk} C={C} />
          <StatCard label="Tempo pace" value={fitness.tempoPace ? fmtPace(fitness.tempoPace) : "—"} unit="/km" accent={C.red} C={C} />
          <StatCard label="Interval pace" value={fitness.intervalPace ? fmtPace(fitness.intervalPace) : "—"} unit="/km" accent={C.gold} C={C} />
          <StatCard label="5K" value={fmtDuration(fitness.est5k)} accent={C.slate} sub={fitness.est5kSource === "strava" ? "★ gemeten (Strava)" : "geschat (Riegel)"} C={C} />
          <StatCard label="10K" value={fmtDuration(fitness.est10k)} accent={C.slate} sub={fitness.est10kSource === "strava" ? "★ gemeten (Strava)" : "geschat (Riegel)"} C={C} />
          <StatCard label="Half" value={fmtDuration(fitness.estHalf)} accent={C.slate} sub={fitness.estHalfSource === "strava" ? "★ gemeten (Strava)" : "geschat (Riegel)"} C={C} />
        </div>
      </Section>
    </div>
  );
}
