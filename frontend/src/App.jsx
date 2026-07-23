import { useState, useEffect, useMemo } from "react";
import { RefreshCw, LayoutDashboard, ClipboardList, Award, Moon, Sun, LogOut, TrendingUp } from "lucide-react";
import { darkTheme, lightTheme } from "./themes.js";
import { API_BASE, displayFont, bodyFont } from "./constants.js";
import { currentPhase } from "./utils/format.js";
import { getToken, setToken, clearToken, apiFetch } from "./utils/auth.js";
import DashboardTab from "./tabs/DashboardTab.jsx";
import TrendsTab from "./tabs/TrendsTab.jsx";
import RunAnalysisTab from "./tabs/RunAnalysisTab.jsx";
import StatistiekenTab from "./tabs/StatistiekenTab.jsx";
import AddRunModal from "./components/AddRunModal.jsx";

export default function App() {
  const [runs, setRuns] = useState([]);
  const [manualRuns, setManualRuns] = useState([]);
  const [connected, setConnected] = useState(false);
  const [userName, setUserName] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isDarkMode, setIsDarkMode] = useState(true);

  const C = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    const savedTheme = localStorage.getItem("running-coach-theme");
    if (savedTheme === "light") setIsDarkMode(false);

    // if we just came back from Strava's login screen, grab the token from the URL
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      window.history.replaceState({}, "", "/");
    }

    if (getToken()) {
      checkStatus();
      loadMe();
      loadRuns();
      if (params.get("connected")) handleSync();
    } else {
      setLoading(false);
    }
  }, []);

  async function checkStatus() {
    try {
      const res = await apiFetch("/api/status");
      const data = await res.json();
      setConnected(data.connected);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadMe() {
    try {
      const res = await apiFetch("/api/me");
      if (!res.ok) return;
      const data = await res.json();
      setUserName(data.name);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadRuns() {
    setLoading(true);
    try {
      const res = await apiFetch("/api/runs");
      const data = await res.json();
      setRuns(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load runs", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await apiFetch("/api/sync", { method: "POST" });
      await loadRuns();
      setConnected(true);
    } catch (e) {
      console.error("Sync failed", e);
    } finally {
      setSyncing(false);
    }
  }

  async function handleUpdateRun(runId, updates) {
    if (runId.startsWith("manual_")) {
      setManualRuns((prev) => prev.map((r) => (r.id === runId ? { ...r, ...updates } : r)));
      return;
    }
    // optimistic update, then persist
    setRuns((prev) => prev.map((r) => (r.id === runId ? { ...r, ...updates } : r)));
    try {
      const res = await apiFetch(`/api/runs/${runId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update run");
    } catch (e) {
      console.error(e);
      loadRuns(); // revert to server truth if the update failed
    }
  }

  function handleLogout() {
    clearToken();
    setConnected(false);
    setUserName(null);
    setRuns([]);
    setManualRuns([]);
  }

  function toggleTheme() {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("running-coach-theme", newMode ? "dark" : "light");
  }

  const allRuns = useMemo(() => {
    const combined = [...runs, ...manualRuns];
    return combined.sort((a, b) => new Date(a.date) - new Date(b.date)).map((r, i) => ({ ...r, order: i + 1 }));
  }, [runs, manualRuns]);

  // Excluded runs stay visible in the Dashboard's Run Log (so they can be re-included),
  // but are filtered out everywhere else in the app — analysis, stats, fitness estimates.
  const activeRuns = useMemo(() => allRuns.filter((r) => !r.excluded), [allRuns]);

  const phase = currentPhase();

  if (loading) {
    return (
      <div style={{ background: C.ink, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.chalkDim, fontFamily: bodyFont }}>
        Laden...
      </div>
    );
  }

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={15} /> },
    { id: "trends", label: "Trends", icon: <TrendingUp size={15} /> },
    { id: "analysis", label: "Run Analyse", icon: <ClipboardList size={15} /> },
    { id: "stats", label: "Statistieken", icon: <Award size={15} /> },
  ];

  const isLoggedIn = !!getToken();

  return (
    <div style={{ background: C.ink, minHeight: "100vh", fontFamily: bodyFont, padding: "28px 20px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: C.red, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6 }}>
              Running Coach — Trainingslog{userName && ` · ${userName}`}
            </div>
            <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 28, color: C.chalk, letterSpacing: "0.01em" }}>FASE {phase.n} · {phase.label.toUpperCase()}</div>
            <div style={{ fontSize: 13, color: C.chalkDim, marginTop: 4 }}>{phase.desc}</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={toggleTheme}
              style={{ display: "flex", alignItems: "center", gap: 6, background: C.panel, border: `1px solid ${C.slate}`, borderRadius: 6, padding: "8px 14px", color: C.chalk, fontSize: 13, cursor: "pointer" }}
            >
              {isDarkMode ? <Moon size={14} /> : <Sun size={14} />}
              {isDarkMode ? "Light" : "Dark"}
            </button>
            {isLoggedIn ? (
              <>
                <button onClick={handleSync} disabled={syncing} style={{ display: "flex", alignItems: "center", gap: 6, background: C.panel, border: `1px solid ${C.slate}`, borderRadius: 6, padding: "8px 14px", color: C.chalk, fontSize: 13, cursor: "pointer" }}>
                  <RefreshCw size={14} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
                  {syncing ? "Synchroniseren..." : "Ververs Strava"}
                </button>
                <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${C.slate}`, borderRadius: 6, padding: "8px 14px", color: C.chalkDim, fontSize: 13, cursor: "pointer" }}>
                  <LogOut size={14} /> Uitloggen
                </button>
              </>
            ) : (
              <a href={`${API_BASE}/auth/strava`} style={{ display: "flex", alignItems: "center", background: C.red, borderRadius: 6, padding: "8px 14px", color: C.chalk, fontSize: 13, textDecoration: "none" }}>Verbind met Strava</a>
            )}
          </div>
        </div>

        {!isLoggedIn ? (
          <div style={{ background: C.panel, borderRadius: 10, padding: 40, textAlign: "center", color: C.chalkDim }}>
            Log in met Strava om je eigen trainingslog te zien.
          </div>
        ) : (
          <>
            {/* Tab bar */}
            <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.slate}` }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    background: "none", border: "none", cursor: "pointer",
                    padding: "10px 16px",
                    fontFamily: displayFont, fontWeight: 700, fontSize: 13, letterSpacing: "0.04em",
                    color: activeTab === tab.id ? C.chalk : C.chalkDim,
                    borderBottom: activeTab === tab.id ? `2px solid ${C.red}` : "2px solid transparent",
                    marginBottom: -1,
                  }}
                >
                  {tab.icon} {tab.label.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "dashboard" && <DashboardTab allRuns={allRuns} activeRuns={activeRuns} onShowModal={() => setShowModal(true)} onUpdateRun={handleUpdateRun} C={C} />}
            {activeTab === "trends" && <TrendsTab allRuns={activeRuns} C={C} />}
            {activeTab === "analysis" && <RunAnalysisTab allRuns={activeRuns} C={C} />}
            {activeTab === "stats" && <StatistiekenTab connected={connected} C={C} />}
          </>
        )}
      </div>

      {showModal && (
        <AddRunModal onClose={() => setShowModal(false)} onSave={(run) => setManualRuns((prev) => [...prev, run])} C={C} />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
