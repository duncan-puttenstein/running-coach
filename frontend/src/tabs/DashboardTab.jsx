import { useState } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import { fmtPace, fmtDuration } from "../utils/format.js";
import { filterRunsByRange, getComparisonRuns } from "../utils/dateRangeFilter.js";
import { displayFont, bodyFont } from "../constants.js";
import StatCard from "../components/StatCard.jsx";
import WeeklyVolumeChart from "../components/WeeklyVolumeChart.jsx";
import ActivitiesChart from "../components/ActivitiesChart.jsx";
import DateRangeFilter from "../components/DateRangeFilter.jsx";
import KpiRow from "../components/KpiRow.jsx";
import StatusPanel from "../components/StatusPanel.jsx";
import RunLog from "../components/RunLog.jsx";
import GoalsPanel from "../components/GoalsPanel.jsx";

function SectionHeader({ icon, title, sub, C }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 18, color: C.chalk, letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: 8 }}>
        {icon} {title}
      </div>
      {sub && <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.chalkDim, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function DashboardTab({ allRuns, activeRuns, onShowModal, onUpdateRun, C }) {
  const [range, setRange] = useState({ key: "week" });

  const filteredActive = filterRunsByRange(activeRuns, range.key, range.start, range.end);
  const filteredAll = filterRunsByRange(allRuns, range.key, range.start, range.end);
  const previousActive = getComparisonRuns(activeRuns, range.key, range.start, range.end);

  // Fitness Update intentionally ignores the date filter — it reflects your full current
  // fitness picture, not just the currently viewed period.
  const longRuns = activeRuns.filter((r) => r.type === "Long");
  const tempoRuns = activeRuns.filter((r) => r.type === "Tempo");
  const easyPace = longRuns.length ? longRuns.reduce((a, r) => a + r.movingSec / r.distance, 0) / longRuns.length : null;
  const tempoPace = tempoRuns.length ? Math.min(...tempoRuns.map((r) => r.movingSec / r.distance)) : null;
  const qualityRuns = activeRuns.filter((r) => r.type === "Tempo" || r.type === "Interval" || r.type === "Test");
  const bestEffort = qualityRuns.reduce((best, r) => (!best || r.movingSec / r.distance < best.movingSec / best.distance ? r : best), null);
  const riegel = (targetKm) => (bestEffort ? bestEffort.movingSec * Math.pow(targetKm / bestEffort.distance, 1.06) : null);

  if (allRuns.length === 0) {
    return (
      <div style={{ background: C.panel, borderRadius: 10, padding: 40, textAlign: "center", color: C.chalkDim }}>
        Nog geen runs. Verbind met Strava of voeg handmatig een run toe.
        <div style={{ marginTop: 16 }}>
          <button onClick={onShowModal} style={{ background: C.red, border: "none", borderRadius: 6, padding: "10px 16px", color: C.chalk, fontFamily: bodyFont, fontSize: 13, cursor: "pointer" }}>Run handmatig toevoegen</button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Status */}
      <StatusPanel activeRuns={activeRuns} C={C} />

      {/* Goals — aanpasbaar, opgeslagen op dit apparaat */}
      <GoalsPanel C={C} />

      {/* Filters */}
      <DateRangeFilter value={range} onChange={setRange} C={C} />

      {filteredActive.length === 0 ? (
        <div style={{ background: C.panel, borderRadius: 10, padding: 40, textAlign: "center", color: C.chalkDim, marginBottom: 28 }}>
          Geen runs in deze periode. Kies een andere periode hierboven.
        </div>
      ) : (
        <>
          {/* KPIs */}
          <KpiRow runs={filteredActive} previousRuns={previousActive} C={C} />

          {/* Grafieken */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 28 }}>
            <div style={{ flex: "1 1 380px", background: C.panel, borderRadius: 10, padding: 22 }}>
              <SectionHeader icon={<BarChart3 size={18} color={C.red} />} title="ACTIVITEITEN" sub="Aantal runs per week, incl. weken zonder runs" C={C} />
              <ActivitiesChart allRuns={filteredActive} range={range} C={C} />
            </div>
            <div style={{ flex: "1 1 380px", background: C.panel, borderRadius: 10, padding: 22 }}>
              <SectionHeader icon={<TrendingUp size={18} color={C.red} />} title="VOLUME" sub="Kilometers per week, incl. weken zonder runs" C={C} />
              <WeeklyVolumeChart allRuns={filteredActive} range={range} C={C} />
            </div>
          </div>
        </>
      )}

      {/* Fitness Update */}
      <div style={{ marginBottom: 28 }}>
        <SectionHeader title="FITNESS UPDATE" sub="Gebaseerd op je volledige geschiedenis, ongeacht de gekozen periode hierboven" C={C} />
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <StatCard label="Easy pace" value={easyPace ? fmtPace(easyPace) : "—"} unit="/km" accent={C.chalk} C={C} />
          <StatCard label="Tempo pace" value={tempoPace ? fmtPace(tempoPace) : "—"} unit="/km" accent={C.red} C={C} />
          <StatCard label="Est. 5K" value={fmtDuration(riegel(5))} accent={C.slate} C={C} />
          <StatCard label="Est. 10K" value={fmtDuration(riegel(10))} accent={C.slate} C={C} />
          <StatCard label="Est. Half" value={fmtDuration(riegel(21.1))} accent={C.slate} C={C} />
        </div>
      </div>

      {/* Run Log — onder Fitness Update, zoals gevraagd */}
      <RunLog runs={filteredAll} onShowModal={onShowModal} onUpdateRun={onUpdateRun} C={C} />
    </>
  );
}
