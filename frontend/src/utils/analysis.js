// Pure analysis logic — no React here, just data in, structured insights out.

export function avgPace(run) {
  return run.movingSec / run.distance;
}

function splitPaces(run) {
  return run.splits.map((s, i) => s / (run.splitDistances?.[i] || 1));
}

function stdDev(arr) {
  if (!arr.length) return 0;
  const m = mean(arr);
  return Math.sqrt(mean(arr.map((x) => (x - m) ** 2)));
}

function mean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

// find a Strava best_effort by (partial, case-insensitive) name match
function findBestEffort(run, nameFragment) {
  if (!run.bestEfforts || !run.bestEfforts.length) return null;
  const match = run.bestEfforts.find((be) =>
    be.name.toLowerCase().replace(/\s/g, "").includes(nameFragment.toLowerCase().replace(/\s/g, ""))
  );
  return match || null;
}

// Zones as a ratio of pace vs. threshold (predicted 5K) pace — lower ratio = faster than threshold.
// This mirrors the standard 6-zone running pace model (Strava's "Pace Zones" card uses the same idea).
const PACE_ZONE_RATIOS = [
  { zone: 6, label: "Sprint", min: 0, max: 0.93 },
  { zone: 5, label: "VO2max", min: 0.93, max: 0.99 },
  { zone: 4, label: "Drempel", min: 0.99, max: 1.05 },
  { zone: 3, label: "Tempo", min: 1.05, max: 1.18 },
  { zone: 2, label: "Duurloop", min: 1.18, max: 1.37 },
  { zone: 1, label: "Herstel", min: 1.37, max: Infinity },
];

// Attributes each km-split's time to a pace zone, based on that split's pace relative
// to the threshold (predicted 5K) pace. Coarser than a per-second stream, but requires
// no extra data — works with what we already store for every run.
function computePaceZones(run, paces, thresholdPaceSecPerKm) {
  if (!thresholdPaceSecPerKm || !paces.length) return null;

  const zoneSeconds = PACE_ZONE_RATIOS.map(() => 0);
  paces.forEach((p, i) => {
    const ratio = p / thresholdPaceSecPerKm;
    let idx = PACE_ZONE_RATIOS.findIndex((z) => ratio >= z.min && ratio < z.max);
    if (idx === -1) idx = PACE_ZONE_RATIOS.length - 1;
    zoneSeconds[idx] += run.splits[i] || 0;
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

function paceZonesInsight(zones) {
  if (!zones) return null;
  const byZone = Object.fromEntries(zones.map((z) => [z.zone, z.pct]));
  const easy = (byZone[1] || 0) + (byZone[2] || 0);
  const tempoThreshold = (byZone[3] || 0) + (byZone[4] || 0);
  const hard = (byZone[5] || 0) + (byZone[6] || 0);

  if (hard > 25) return `Aanzienlijk aandeel hoge-intensiteit werk (${Math.round(hard)}%) — check of dit een intervalsessie was.`;
  if (tempoThreshold > 55) return `Overwegend tempo- & drempelwerk (${Math.round(tempoThreshold)}%). Stevige kwaliteitstraining.`;
  if (easy > 70) return `Overwegend rustig duurloop-werk (${Math.round(easy)}%). Goede aerobe basis-training.`;
  return "Gemengde inspanning over meerdere zones — een evenwichtige run.";
}


/**
 * Full coaching-style analysis of one run, in the context of everything before it.
 */
export function analyzeRun(allRuns, runId) {
  const sorted = [...allRuns].sort((a, b) => new Date(a.date) - new Date(b.date));
  const idx = sorted.findIndex((r) => r.id === runId);
  if (idx === -1) return null;

  const run = sorted[idx];
  const history = sorted.slice(0, idx);

  // ---------- 1. Run Summary ----------
  const pace = avgPace(run);
  const elev = run.elev && run.elev.length ? run.elev : [];
  const elevGain = elev.filter((e) => e > 0).reduce((a, b) => a + b, 0);
  const elevLoss = Math.abs(elev.filter((e) => e < 0).reduce((a, b) => a + b, 0));

  // ---------- 2. Comparison With Previous Runs ----------
  const sameType = history.filter((r) => r.type === run.type);
  let comparison = { sampleSize: history.length, sameTypeSampleSize: sameType.length };

  if (sameType.length) {
    const prevBestPace = Math.min(...sameType.map(avgPace));
    const prevAvgPace = mean(sameType.map(avgPace));
    comparison.paceDeltaVsBest = pace - prevBestPace;
    comparison.paceDeltaVsAvg = pace - prevAvgPace;
    comparison.isPR = pace < prevBestPace;
    comparison.prevBestPace = prevBestPace;
    comparison.prevAvgPace = prevAvgPace;
  }

  const longestPrevDistance = history.length ? Math.max(...history.map((r) => r.distance)) : 0;
  comparison.isLongestDistance = run.distance > longestPrevDistance;
  comparison.longestPrevDistance = longestPrevDistance;

  const recentPaces = sorted.slice(Math.max(0, idx - 4), idx + 1).map(avgPace);
  let overallTrend = "stabiel";
  if (recentPaces.length >= 3) {
    const firstThird = mean(recentPaces.slice(0, Math.ceil(recentPaces.length / 2)));
    const lastThird = mean(recentPaces.slice(Math.floor(recentPaces.length / 2)));
    if (lastThird < firstThird - 5) overallTrend = "verbeterend";
    else if (lastThird > firstThird + 5) overallTrend = "vertragend";
  }
  comparison.overallTrend = overallTrend;

  // suffer_score trend vs history average (only meaningful if Strava provided it)
  const historySufferScores = history.map((r) => r.sufferScore).filter((s) => s != null);
  if (run.sufferScore != null && historySufferScores.length) {
    comparison.sufferScoreAvg = mean(historySufferScores);
    comparison.sufferScoreDelta = run.sufferScore - comparison.sufferScoreAvg;
  }

  // ---------- 3. Split & Pacing Analysis ----------
  const paces = splitPaces(run);
  const runElev = elev.length === paces.length ? elev : paces.map(() => 0);
  const avgSplitPace = mean(paces);

  const half = Math.ceil(paces.length / 2);
  const firstHalfAvg = mean(paces.slice(0, half));
  const secondHalfAvg = mean(paces.slice(half));
  const splitDiff = secondHalfAvg - firstHalfAvg;
  let splitType = "even";
  if (splitDiff > 6) splitType = "positive";
  else if (splitDiff < -6) splitType = "negative";

  const variance = stdDev(paces);
  const fastestIdx = paces.indexOf(Math.min(...paces));
  const slowestIdx = paces.length > 1 ? paces.indexOf(Math.max(...paces)) : -1;
  const finishingKick = paces.length > 1 ? paces[paces.length - 1] - paces[paces.length - 2] : 0;

  const terrainFlags = paces.map((p, i) => {
    const e = runElev[i];
    if (e <= -10 && p < avgSplitPace - 4) return "downhill-aided";
    if (e >= 10 && p > avgSplitPace + 4) return "uphill-slowed";
    return null;
  });

  // ---------- 4. Trends ----------
  const disciplineWindow = sorted.slice(Math.max(0, idx - 4), idx + 1);
  const disciplineTrend = disciplineWindow.map((r) => ({
    order: sorted.indexOf(r) + 1,
    type: r.type,
    variance: stdDev(splitPaces(r)),
    isCurrent: r.id === run.id,
  }));
  let disciplineDirection = "stabiel";
  if (disciplineTrend.length >= 3) {
    const early = mean(disciplineTrend.slice(0, Math.ceil(disciplineTrend.length / 2)).map((d) => d.variance));
    const late = mean(disciplineTrend.slice(Math.floor(disciplineTrend.length / 2)).map((d) => d.variance));
    if (late < early - 3) disciplineDirection = "verbeterend";
    else if (late > early + 3) disciplineDirection = "verslechterend";
  }

  // ---------- 5. Coaching Feedback ----------
  const feedback = [];

  if (comparison.isPR) {
    feedback.push({ tone: "positive", text: `Dit is je snelste ${run.type.toLowerCase()}-run tot nu toe.` });
  } else if (comparison.paceDeltaVsAvg !== undefined && comparison.paceDeltaVsAvg < -3) {
    feedback.push({ tone: "positive", text: `Sneller dan je gemiddelde ${run.type.toLowerCase()}-pace — duidelijke vooruitgang.` });
  }

  if (run.prCount > 0) {
    feedback.push({ tone: "positive", text: `Strava registreerde ${run.prCount} persoonlijk record${run.prCount > 1 ? "s" : ""} tijdens deze run${run.achievementCount ? ` (${run.achievementCount} prestaties in totaal)` : ""}.` });
  }

  if (splitType === "positive" && variance > 15) {
    feedback.push({ tone: "warning", text: "Je bent waarschijnlijk te hard van start gegaan en gezakt in tempo — volgende keer bewust iets rustiger beginnen." });
  } else if (splitType === "even" && variance < 10) {
    feedback.push({ tone: "positive", text: "Uitstekende pacing-discipline — je splits liggen dicht bij elkaar." });
  } else if (splitType === "negative") {
    feedback.push({ tone: "positive", text: "Negatieve splits — je werd sneller richting het einde, een teken van goede opbouw of resterende reserve." });
  }

  if (finishingKick < -8) {
    feedback.push({ tone: "positive", text: "Sterke eindsprint in de laatste kilometer." });
  } else if (finishingKick > 15) {
    feedback.push({ tone: "warning", text: "Duidelijke vertraging in de laatste kilometer — mogelijk vermoeidheid." });
  }

  const downhillFlags = terrainFlags.filter((f) => f === "downhill-aided").length;
  if (downhillFlags > 0) {
    feedback.push({ tone: "neutral", text: `${downhillFlags} van je snelste split(s) werden deels geholpen door afdalend terrein.` });
  }

  if (comparison.sufferScoreDelta !== undefined) {
    if (comparison.sufferScoreDelta > 15) {
      feedback.push({ tone: "warning", text: `Relative Effort van ${run.sufferScore} ligt duidelijk boven je gemiddelde (${Math.round(comparison.sufferScoreAvg)}) — dit was een zware inspanning, plan voldoende herstel voor je volgende run.` });
    } else if (comparison.sufferScoreDelta < -15) {
      feedback.push({ tone: "neutral", text: `Relative Effort van ${run.sufferScore} ligt onder je gemiddelde — een relatief lichte inspanning.` });
    }
  } else if (comparison.isPR || pace < 5 * 60) {
    feedback.push({ tone: "warning", text: "Dit was een pittige inspanning — bouw je volgende run rustig op." });
  }

  // ---------- 6. Zones summary ----------
  let zoneSummary = null;
  if (run.zones && run.zones.length) {
    const totalSec = run.zones.reduce((a, z) => a + z.seconds, 0);
    zoneSummary = run.zones.map((z) => ({ ...z, pct: totalSec ? (z.seconds / totalSec) * 100 : 0 }));
  }

  // ---------- 7. Best efforts (this run) ----------
  const best5k = findBestEffort(run, "5k");
  const best10k = findBestEffort(run, "10k");
  const bestHalf = findBestEffort(run, "half-marathon") || findBestEffort(run, "halfmarathon");
  const best1k = findBestEffort(run, "1k");
  const bestMile = findBestEffort(run, "1mile");

  // ---------- 8. Updated Fitness Assessment (all runs up to and including this one) ----------
  const runsUpToHere = sorted.slice(0, idx + 1);
  const longRuns = runsUpToHere.filter((r) => r.type === "Long");
  const tempoRuns = runsUpToHere.filter((r) => r.type === "Tempo");
  const intervalRuns = runsUpToHere.filter((r) => r.type === "Interval");

  const easyPace = longRuns.length ? mean(longRuns.map(avgPace)) : null;
  const tempoPace = tempoRuns.length ? Math.min(...tempoRuns.map(avgPace)) : null;
  const intervalPace = intervalRuns.length ? Math.min(...intervalRuns.map(avgPace)) : null;

  // prefer real Strava best_efforts across all runs so far over a Riegel projection
  let bestKnown5k = null, bestKnown10k = null, bestKnownHalf = null;
  for (const r of runsUpToHere) {
    const e5 = findBestEffort(r, "5k");
    const e10 = findBestEffort(r, "10k");
    const eh = findBestEffort(r, "half-marathon") || findBestEffort(r, "halfmarathon");
    if (e5 && (!bestKnown5k || e5.movingSec < bestKnown5k)) bestKnown5k = e5.movingSec;
    if (e10 && (!bestKnown10k || e10.movingSec < bestKnown10k)) bestKnown10k = e10.movingSec;
    if (eh && (!bestKnownHalf || eh.movingSec < bestKnownHalf)) bestKnownHalf = eh.movingSec;
  }

  const qualityRuns = runsUpToHere.filter((r) => ["Tempo", "Interval", "Test"].includes(r.type));
  const bestEffortRun = qualityRuns.reduce((best, r) => (!best || avgPace(r) < avgPace(best) ? r : best), null);
  const riegel = (targetKm) => (bestEffortRun ? bestEffortRun.movingSec * Math.pow(targetKm / bestEffortRun.distance, 1.06) : null);

  const fitness = {
    easyPace,
    tempoPace,
    intervalPace,
    est5k: bestKnown5k ?? riegel(5),
    est5kSource: bestKnown5k ? "strava" : "geschat",
    est10k: bestKnown10k ?? riegel(10),
    est10kSource: bestKnown10k ? "strava" : "geschat",
    estHalf: bestKnownHalf ?? riegel(21.1),
    estHalfSource: bestKnownHalf ? "strava" : "geschat",
  };

  // Threshold pace for zone calculations: derived from this run's own predicted 5K,
  // so zones stay consistent with the "as of this run" fitness picture used elsewhere.
  const thresholdPaceSecPerKm = fitness.est5k ? fitness.est5k / 5 : null;
  const paceZones = computePaceZones(run, paces, thresholdPaceSecPerKm);
  const paceZonesText = paceZonesInsight(paceZones);

  return {
    run, pace, elevGain, elevLoss, comparison, splitType, variance, fastestIdx, slowestIdx,
    finishingKick, terrainFlags, paces, runElev, disciplineTrend, disciplineDirection, feedback,
    fitness, zoneSummary, paceZones, paceZonesText,
    bestEfforts: { best1k, bestMile, best5k, best10k, bestHalf },
  };
}
