import { useState, useEffect, useMemo } from "react";
import { RefreshCw, LayoutDashboard, ClipboardList, Award, Moon, Sun } from "lucide-react";
import { darkTheme, lightTheme } from "./themes.js";
import { API_BASE, displayFont, bodyFont } from "./constants.js";
import { currentPhase } from "./utils/format.js";
import DashboardTab from "./tabs/DashboardTab.jsx";
import RunAnalysisTab from "./tabs/RunAnalysisTab.jsx";
import StatistiekenTab from "./tabs/StatistiekenTab.jsx";
import AddRunModal from "./components/AddRunModal.jsx";

export default function App() {
  const [runs, setRuns] = useState([]);
  const [manualRuns, setManualRuns] = useState([]);
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isDarkMode, setIsDarkMode] = useState(true);

  const C = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    const savedTheme = localStorage.getItem("running-coach-theme");
    if (savedTheme === "light") setIsDarkMode(false);

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
    } catch (e) {
      console.error(e);
    }
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

  function toggleTheme() {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("running-coach-theme", newMode ? "dark" : "light");
  }

  const allRuns = useMemo(() => {
    const combined = [...runs, ...manualRuns];
    return combined.sort((a, b) => new Date(a.date) - new Date(b.date)).map((r, i) => ({ ...r, order: i + 1 }));
  }, [runs, manualRuns]);

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
    { id: "analysis", label: "Run Analyse", icon: <ClipboardList size={15} /> },
    { id: "stats", label: "Statistieken", icon: <Award size={15} /> },
  ];

  return (
    <div style={{ background: C.ink, minHeight: "100vh", fontFamily: bodyFont, padding: "28px 20px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: C.red, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6 }}>Running Coach — Trainingslog</div>
            <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 28, color: C.chalk, letterSpacing: "0.01em" }}>FASE {phase.n} · {phase.label.toUpperCase()}</div>
            <div style={{ fontSize: 13, color: C.chalkDim, marginTop: 4 }}>{phase.desc}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={toggleTheme}
              style={{ display: "flex", alignItems: "center", gap: 6, background: C.panel, border: `1px solid ${C.slate}`, borderRadius: 6, padding: "8px 14px", color: C.chalk, fontSize: 13, cursor: "pointer" }}
            >
              {isDarkMode ? <Moon size={14} /> : <Sun size={14} />}
              {isDarkMode ? "Light" : "Dark"}
            </button>
            {connected ? (
              <button onClick={handleSync} disabled={syncing} style={{ display: "flex", alignItems: "center", gap: 6, background: C.panel, border: `1px solid ${C.slate}`, borderRadius: 6, padding: "8px 14px", color: C.chalk, fontSize: 13, cursor: "pointer" }}>
                <RefreshCw size={14} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
                {syncing ? "Synchroniseren..." : "Ververs Strava"}
              </button>
            ) : (
              <a href={`${API_BASE}/auth/strava`} style={{ display: "flex", alignItems: "center", background: C.red, borderRadius: 6, padding: "8px 14px", color: C.chalk, fontSize: 13, textDecoration: "none" }}>Verbind met Strava</a>
            )}
          </div>
        </div>

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
        {activeTab === "dashboard" && <DashboardTab allRuns={allRuns} onShowModal={() => setShowModal(true)} C={C} />}
        {activeTab === "analysis" && <RunAnalysisTab allRuns={allRuns} C={C} />}
        {activeTab === "stats" && <StatistiekenTab connected={connected} C={C} />}
      </div>

      {showModal && (
        <AddRunModal onClose={() => setShowModal(false)} onSave={(run) => setManualRuns((prev) => [...prev, run])} C={C} />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
