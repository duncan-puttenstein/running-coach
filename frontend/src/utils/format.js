// Pure formatting helpers — no React, no theme. Safe to reuse anywhere.

export function fmtPace(secPerKm) {
  if (!secPerKm || !isFinite(secPerKm)) return "—";
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function fmtDuration(sec) {
  if (!sec || !isFinite(sec)) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  return h > 0
    ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    : `${m}:${s.toString().padStart(2, "0")}`;
}

export function fmtDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtPaceDelta(deltaSec) {
  if (deltaSec === undefined) return "—";
  const sign = deltaSec <= 0 ? "−" : "+";
  return `${sign}${Math.abs(Math.round(deltaSec))}s/km`;
}

export function fmtKm(meters) {
  if (!meters) return "0";
  return (meters / 1000).toFixed(1);
}

export function daysUntil(dateStr) {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
}

export function currentPhase() {
  const now = new Date();
  const p2 = new Date("2026-08-04");
  const p3 = new Date("2026-09-01");
  if (now < p2) return { n: 1, label: "Base Build", desc: "Long run groeit langzaam. Tempo/interval bouwt surges in." };
  if (now < p3) return { n: 2, label: "Football-Specific Sharpening", desc: "Intervallen worden prioriteit. Long run blijft stabiel." };
  return { n: 3, label: "16K Peak & Taper", desc: "Focus op long run, piek rond 13 sept, daarna taper." };
}

// Needs the current theme (C) since the returned value is a color.
export function typeColor(type, C) {
  if (type === "Long") return C.chalk;
  if (type === "Tempo") return C.red;
  if (type === "Interval") return C.gold;
  return C.chalkDim;
}
