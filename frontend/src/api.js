export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

async function safeJson(res) {
  try {
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function getRuns() {
  const res = await fetch(`${API_BASE}/api/runs`);
  if (!res.ok) throw new Error(`getRuns failed: ${res.status}`);
  return safeJson(res);
}

export async function getStatus() {
  const res = await fetch(`${API_BASE}/api/status`);
  if (!res.ok) return { connected: false };
  return safeJson(res);
}

export async function syncRuns() {
  const res = await fetch(`${API_BASE}/api/sync`, { method: "POST" });
  if (!res.ok) throw new Error(`sync failed: ${res.status}`);
  return safeJson(res);
}

export async function getAthleteStats() {
  const res = await fetch(`${API_BASE}/api/athlete/stats`);
  if (!res.ok) throw new Error(`getAthleteStats failed: ${res.status}`);
  return safeJson(res);
}

export function getStravaAuthUrl() {
  return `${API_BASE}/auth/strava`;
}
