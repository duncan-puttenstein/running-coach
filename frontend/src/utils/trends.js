import { avgPace } from "./analysis.js";

function mean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function stdDev(arr) {
  if (!arr.length) return 0;
  const m = mean(arr);
  return Math.sqrt(mean(arr.map((x) => (x - m) ** 2)));
}

function splitPaces(run) {
  return run.splits.map((s, i) => s / (run.splitDistances?.[i] || 1));
}

export function trainingDistribution(runs) {
  const byType = {};
  runs.forEach((r) => {
    if (!byType[r.type]) byType[r.type] = { type: r.type, count: 0, km: 0 };
    byType[r.type].count += 1;
    byType[r.type].km += r.distance;
  });
  return Object.values(byType);
}

const PACE_ZONE_RATIOS = [
  { zone: 6, label: "Sprint", min: 0, max: 0.93 },
  { zone: 5, label: "VO2max", min: 0.93, max: 0.99 },
  { zone: 4, label: "Drempel", min: 0.99, max: 1.05 },
  { zone: 3, label: "Tempo", min: 1.05, max: 1.18 },
  { zone: 2, label: "Duurloop", min: 1.18, max: 1.37 },
  { zone: 1, label: "Herstel", min: 1.37, max: Infinity },
];

// Aggregate pace-zone time across many runs, relative to one current threshold pace.
export function aggregatePaceZones(runs, thresholdPaceSecPerKm) {
  if (!thresholdPaceSecPerKm) return null;
  const zoneSeconds = PACE_ZONE_RATIOS.map(() => 0);
  runs.forEach((run) => {
    const paces = splitPaces(run);
    paces.forEach((p, i) => {
      const ratio = p / thresholdPaceSecPerKm;
      let idx = PACE_ZONE_RATIOS.findIndex((z) => ratio >= z.min && ratio < z.max);
      if (idx === -1) idx = PACE_ZONE_RATIOS.length - 1;
      zoneSeconds[idx] += run.splits[i] || 0;
    });
  });
  const total = zoneSeconds.reduce((a, b) => a + b, 0);
  return PACE_ZONE_RATIOS.map((z, i) => ({
    zone: z.zone,
    label: z.label,
    seconds: zoneSeconds[i],
    pct: total ? (zoneSeconds[i] / total) * 100 : 0,
    minPaceSec: z.min * thresholdPaceSecPerKm,
    maxPaceSec: z.max === Infinity ? Infinity : z.max * thresholdPaceSecPerKm,
  }));
}

// Pacing-discipline (split variance) across every run, chronologically.
export function consistencyTrend(runsSortedAsc) {
  return runsSortedAsc.map((r, i) => ({
    order: r.order ?? i + 1,
    variance: stdDev(splitPaces(r)),
    type: r.type,
  }));
}

// Average heart rate per run, chronologically.
export function heartRateTrend(runsSortedAsc) {
  return runsSortedAsc
    .filter((r) => r.avgHeartrate != null)
    .map((r) => ({ order: r.order, hr: Math.round(r.avgHeartrate), type: r.type }));
}

// Aggregate time-in-HR-zone across every run that has zone data.
export function aggregateHrZones(runs) {
  const withZones = runs.filter((r) => r.zones && r.zones.length);
  if (!withZones.length) return null;
  const zoneCount = withZones[0].zones.length;
  const totals = Array.from({ length: zoneCount }, () => 0);
  withZones.forEach((r) => r.zones.forEach((z, i) => { totals[i] += z.seconds; }));
  const total = totals.reduce((a, b) => a + b, 0);
  return totals.map((seconds, i) => ({ zone: i + 1, seconds, pct: total ? (seconds / total) * 100 : 0 }));
}

function histogram(values, bucketSize, unitLabel) {
  if (!values.length) return [];
  const min = Math.floor(Math.min(...values) / bucketSize) * bucketSize;
  const max = Math.ceil(Math.max(...values) / bucketSize) * bucketSize;
  const buckets = [];
  for (let b = min; b < max; b += bucketSize) {
    buckets.push({ label: `${b}-${b + bucketSize}${unitLabel}`, from: b, to: b + bucketSize, count: 0 });
  }
  values.forEach((v) => {
    const bucket = buckets.find((b) => v >= b.from && v < b.to) || buckets[buckets.length - 1];
    if (bucket) bucket.count += 1;
  });
  return buckets;
}

export function distanceDistribution(runs) {
  return histogram(runs.map((r) => r.distance), 2, "km");
}

export function paceDistribution(runs) {
  const paces = runs.map((r) => Math.round(avgPace(r) / 15) * 15); // round to nearest 15s for cleaner buckets
  return histogram(paces.map((s) => s / 60), 0.5, "min/km");
}

export function paceVsDistance(runs) {
  return runs.map((r) => ({ distance: r.distance, pace: +(avgPace(r) / 60).toFixed(2), type: r.type }));
}

export function paceVsHeartRate(runs) {
  return runs
    .filter((r) => r.avgHeartrate != null)
    .map((r) => ({ hr: Math.round(r.avgHeartrate), pace: +(avgPace(r) / 60).toFixed(2), type: r.type }));
}

// Rule-based "AI Coaching Insights" — template text, not a live model call.
export function generateTrendInsights(runsSortedAsc) {
  const insights = [];
  if (runsSortedAsc.length < 3) {
    return [{ tone: "neutral", text: "Nog niet genoeg runs voor betrouwbare trends — log er nog een paar." }];
  }

  const half = Math.ceil(runsSortedAsc.length / 2);
  const firstHalf = runsSortedAsc.slice(0, half);
  const secondHalf = runsSortedAsc.slice(half);
  const paceFirst = mean(firstHalf.map(avgPace));
  const paceSecond = mean(secondHalf.map(avgPace));
  const paceDeltaPct = ((paceSecond - paceFirst) / paceFirst) * 100;

  if (paceDeltaPct < -2) {
    insights.push({ tone: "positive", text: `Je gemiddelde pace is in de recentere helft van je log ${Math.abs(paceDeltaPct).toFixed(0)}% sneller dan in de eerdere helft — duidelijke vooruitgang.` });
  } else if (paceDeltaPct > 2) {
    insights.push({ tone: "warning", text: `Je gemiddelde pace ligt recent ${paceDeltaPct.toFixed(0)}% lager dan eerder — kan duiden op een opbouwfase, herstel, of vermoeidheid.` });
  } else {
    insights.push({ tone: "neutral", text: "Je gemiddelde pace is stabiel gebleven over je hele logboek." });
  }

  const varFirst = mean(firstHalf.map((r) => stdDev(splitPaces(r))));
  const varSecond = mean(secondHalf.map((r) => stdDev(splitPaces(r))));
  if (varSecond < varFirst - 3) {
    insights.push({ tone: "positive", text: "Je pacing-discipline is verbeterd — recentere runs hebben gelijkmatigere splits." });
  } else if (varSecond > varFirst + 3) {
    insights.push({ tone: "warning", text: "Je splits zijn recent wisselvalliger geworden dan eerder — let op even pacing." });
  }

  const volumeFirst = firstHalf.reduce((a, r) => a + r.distance, 0);
  const volumeSecond = secondHalf.reduce((a, r) => a + r.distance, 0);
  if (volumeSecond > volumeFirst * 1.15) {
    insights.push({ tone: "neutral", text: "Je trainingsvolume is recent flink toegenomen — houd je herstel goed in de gaten." });
  }

  const typeCounts = {};
  runsSortedAsc.forEach((r) => { typeCounts[r.type] = (typeCounts[r.type] || 0) + 1; });
  const dominant = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
  if (dominant && dominant[1] / runsSortedAsc.length > 0.6) {
    insights.push({ tone: "neutral", text: `${dominant[0]}-runs maken meer dan 60% van je log uit — overweeg meer variatie voor een completere opbouw.` });
  }

  return insights;
}
