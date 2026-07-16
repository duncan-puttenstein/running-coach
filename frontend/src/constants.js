// Central place for values used across many files.
// Change a font or the API URL here once, instead of hunting through every component.

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export const displayFont = "'Arial Narrow', 'Helvetica Neue', Arial, sans-serif";
export const bodyFont = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
export const monoFont = "'SF Mono', 'Roboto Mono', Menlo, Consolas, monospace";

export const ZONE_LABELS = ["Z1 Herstel", "Z2 Aeroob", "Z3 Tempo", "Z4 Drempel", "Z5 Max"];
export const ZONE_COLORS = ["#3A4964", "#4C6785", "#D9A544", "#E08A2B", "#C81D25"];
