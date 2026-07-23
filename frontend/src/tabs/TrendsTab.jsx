import { useState, useMemo } from "react";
import { PieChart as PieIcon, Activity, TrendingUp, HeartPulse, BarChart3, Sparkles } from "lucide-react";
import { avgPace } from "../utils/analysis.js";
import {
  trainingDistribution, aggregatePaceZones, consistencyTrend, heartRateTrend,
  aggregateHrZones, distanceDistribution, paceDistribution, paceVsDistance,
  paceVsHeartRate, generateTrendInsights,
} from "../utils/trends.js";
import Section from "../components/Section.jsx";
import RunTypeFilterTabs from "../components/RunTypeFilterTabs.jsx";
import TrainingDistributionPie from "../components/TrainingDistributionPie.jsx";
import PaceZonesCard from "../components/PaceZonesCard.jsx";
import ConsistencyTrendChart from "../components/ConsistencyTrendChart.jsx";
import HeartRateAnalysisChart from "../components/HeartRateAnalysisChart.jsx";
import EffortChart from "../components/EffortChart.jsx";
import ZoneBar from "../components/ZoneBar.jsx";
import DistanceDistributionChart from "../components/DistanceDistributionChart.jsx";
import PaceDistributionChart from "../components/PaceDistributionChart.jsx";
import CorrelationScatter from "../components/CorrelationScatter.jsx";
import TrendInsights from "../components/TrendInsights.jsx";

export default function TrendsTab({ allRuns, C }) {
  const [typeFilter, setTypeFilter] = useState("all");

  const sorted = [...allRuns].sort((a, b) => new Date(a.date) - new Date(b.date));
  const filtered = typeFilter === "all" ? sorted : sorted.filter((r) => r.type === typeFilter);

  const qualityRuns = allRuns.filter((r) => ["Tempo", "Interval", "Test"].includes(r.type));
  const bestEffort = qualityRuns.reduce((best, r) => (!best || avgPace(r) < avgPace(best) ? r : best), null);
  const thresholdPace = bestEffort ? bestEffort.movingSec * Math.pow(5 / bestEffort.distance, 1.06) / 5 : null;

  const paceZones = useMemo(() => aggregatePaceZones(filtered, thresholdPace), [filtered, thresholdPace]);
  const insights = useMemo(() => generateTrendInsights(filtered), [filtered]);

  if (!allRuns.length) {
    return <div style={{ color: C.chalkDim, padding: 20 }}>Nog geen runs om trends van te tonen.</div>;
  }

  return (
    <div>
      <RunTypeFilterTabs value={typeFilter} onChange={setTypeFilter} C={C} />

      {filtered.length === 0 ? (
        <div style={{ background: C.panel, borderRadius: 10, padding: 40, textAlign: "center", color: C.chalkDim }}>
          Geen runs van dit type gevonden.
        </div>
      ) : (
        <>
          <Section title="TRAINING DISTRIBUTION" icon={<PieIcon size={16} color={C.red} />} C={C}>
            <TrainingDistributionPie runs={filtered} C={C} />
          </Section>

          <Section title="PACE ZONES (AGGREGAAT)" icon={<Activity size={16} color={C.red} />} C={C}>
            <PaceZonesCard paceZones={paceZones} insight={null} C={C} />
          </Section>

          <Section title="PACE CONSISTENTIE ONTWIKKELING" icon={<TrendingUp size={16} color={C.red} />} C={C}>
            <ConsistencyTrendChart data={consistencyTrend(filtered)} C={C} />
          </Section>

          <Section title="HEART RATE ANALYSE" icon={<HeartPulse size={16} color={C.red} />} C={C}>
            <HeartRateAnalysisChart data={heartRateTrend(filtered)} C={C} />
          </Section>

          <Section title="RELATIVE EFFORT" icon={<Activity size={16} color={C.red} />} C={C}>
            <EffortChart allRuns={filtered} C={C} />
          </Section>

          <Section title="INSPANNING & HARTSLAGZONES" icon={<HeartPulse size={16} color={C.red} />} C={C}>
            <ZoneBar zoneSummary={aggregateHrZones(filtered)} C={C} />
          </Section>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 380px" }}>
              <Section title="DISTANCE DISTRIBUTION" icon={<BarChart3 size={16} color={C.red} />} C={C}>
                <DistanceDistributionChart buckets={distanceDistribution(filtered)} C={C} />
              </Section>
            </div>
            <div style={{ flex: "1 1 380px" }}>
              <Section title="PACE DISTRIBUTION" icon={<BarChart3 size={16} color={C.red} />} C={C}>
                <PaceDistributionChart buckets={paceDistribution(filtered)} C={C} />
              </Section>
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 380px" }}>
              <Section title="PACE VS DISTANCE" icon={<TrendingUp size={16} color={C.red} />} C={C}>
                <CorrelationScatter data={paceVsDistance(filtered)} xKey="distance" yKey="pace" xLabel="Afstand (km)" yLabel="Pace (min/km)" C={C} />
              </Section>
            </div>
            <div style={{ flex: "1 1 380px" }}>
              <Section title="PACE VS HEART RATE" icon={<HeartPulse size={16} color={C.red} />} C={C}>
                <CorrelationScatter data={paceVsHeartRate(filtered)} xKey="hr" yKey="pace" xLabel="Gem. hartslag (bpm)" yLabel="Pace (min/km)" C={C} />
              </Section>
            </div>
          </div>

          <Section title="AI COACHING INSIGHTS" icon={<Sparkles size={16} color={C.red} />} C={C}>
            <TrendInsights insights={insights} C={C} />
          </Section>
        </>
      )}
    </div>
  );
}
