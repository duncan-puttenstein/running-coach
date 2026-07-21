import { weekStartDate } from "./format.js";

export const RANGE_PRESETS = [
  { key: "last", label: "Laatste run" },
  { key: "week", label: "Deze week" },
  { key: "7d", label: "Laatste 7 dagen" },
  { key: "month", label: "Deze maand" },
  { key: "30d", label: "Laatste 30 dagen" },
  { key: "3m", label: "Laatste 3 maanden" },
  { key: "6m", label: "Laatste 6 maanden" },
  { key: "year", label: "Dit jaar" },
  { key: "all", label: "All Time" },
  { key: "custom", label: "Custom" },
];

function daysAgo(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function monthsAgo(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() - n);
  return d;
}

export function getRangeBounds(rangeKey, customStart, customEnd) {
  const now = new Date();

  switch (rangeKey) {
    case "week":
      return { start: weekStartDate(now.toISOString()), end: null };
    case "7d":
      return { start: daysAgo(6), end: null };
    case "month":
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: null };
    case "30d":
      return { start: daysAgo(29), end: null };
    case "3m":
      return { start: monthsAgo(3), end: null };
    case "6m":
      return { start: monthsAgo(6), end: null };
    case "year":
      return { start: new Date(now.getFullYear(), 0, 1), end: null };
    case "custom":
      return {
        start: customStart ? new Date(customStart) : null,
        end: customEnd ? new Date(customEnd) : null,
      };
    case "all":
    default:
      return { start: null, end: null };
  }
}

export function filterRunsByRange(runs, rangeKey, customStart, customEnd) {
  if (rangeKey === "last") {
    return runs.length ? [runs[runs.length - 1]] : [];
  }

  const { start, end } = getRangeBounds(rangeKey, customStart, customEnd);
  if (!start && !end) return runs;

  return runs.filter((r) => {
    const d = new Date(r.date);
    if (start && d < start) return false;
    if (end) {
      const inclusiveEnd = new Date(end);
      inclusiveEnd.setHours(23, 59, 59, 999);
      if (d > inclusiveEnd) return false;
    }
    return true;
  });
}

/**
 * Runs from the period immediately preceding the current filter, same duration —
 * used for the "% vs previous period" KPI badges. Returns null when a meaningful
 * comparison doesn't make sense (All Time, Laatste run, or an open-ended custom range).
 */
export function getComparisonRuns(runs, rangeKey, customStart, customEnd) {
  if (rangeKey === "all" || rangeKey === "last") return null;

  const { start, end } = getRangeBounds(rangeKey, customStart, customEnd);
  if (!start) return null;

  const effectiveEnd = end || new Date();
  const durationMs = effectiveEnd - start;
  if (durationMs <= 0) return null;

  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(start.getTime() - durationMs);

  return runs.filter((r) => {
    const d = new Date(r.date);
    return d >= prevStart && d <= prevEnd;
  });
}

/**
 * Every Monday-start week within the selected range, even ones with zero runs —
 * so charts can show real gaps instead of silently skipping empty weeks.
 */
export function generateWeekSequence(rangeKey, customStart, customEnd, runsForFallbackStart) {
  if (rangeKey === "last") return [];

  const { start, end } = getRangeBounds(rangeKey, customStart, customEnd);
  let seqStart;
  if (start) {
    seqStart = weekStartDate(start.toISOString());
  } else {
    if (!runsForFallbackStart || !runsForFallbackStart.length) return [];
    const sorted = [...runsForFallbackStart].sort((a, b) => new Date(a.date) - new Date(b.date));
    seqStart = weekStartDate(sorted[0].date);
  }
  const seqEnd = weekStartDate((end || new Date()).toISOString());

  const weeks = [];
  let cursor = new Date(seqStart);
  let guard = 0;
  while (cursor <= seqEnd && guard < 260) {
    weeks.push(new Date(cursor));
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() + 7);
    guard++;
  }
  return weeks;
}
