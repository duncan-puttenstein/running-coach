import { useState, useEffect } from "react";
import { Pencil, Plus } from "lucide-react";
import CountdownLane from "./CountdownLane.jsx";
import GoalEditModal from "./GoalEditModal.jsx";
import { daysUntil } from "../utils/format.js";
import { bodyFont } from "../constants.js";

const STORAGE_KEY = "running-coach-goals";

const DEFAULT_GOALS = [
  { id: "football", title: "Football-ready (hoofddoel)", endDate: "2026-09-01", targetKm: null, subtitle: "Prioriteit bij conflict met Doel 2", icon: "⚽" },
  { id: "16k", title: "16K run", endDate: "2026-09-20", targetKm: 16, subtitle: "Piek ~14-15km rond 13 sept", icon: "🏁" },
];

export default function GoalsPanel({ C }) {
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [editingGoal, setEditingGoal] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setGoals(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }, [goals, loaded]);

  function handleSave(goal) {
    setGoals((prev) => {
      const exists = prev.some((g) => g.id === goal.id);
      return exists ? prev.map((g) => (g.id === goal.id ? goal : g)) : [...prev, goal];
    });
    setEditingGoal(null);
  }

  function handleDelete(id) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setEditingGoal(null);
  }

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {goals.map((g) => {
          const subParts = [g.subtitle, g.targetKm ? `doel: ${g.targetKm}km` : null].filter(Boolean);
          return (
            <div key={g.id} style={{ position: "relative", flex: "1 1 220px" }}>
              <CountdownLane
                title={`${g.icon || ""} ${g.title}`.trim()}
                dateLabel={new Date(g.endDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
                days={daysUntil(g.endDate)}
                color={C.red}
                sub={subParts.join(" · ")}
                C={C}
              />
              <button
                onClick={() => setEditingGoal(g)}
                style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", color: C.chalkDim }}
                title="Doel bewerken"
              >
                <Pencil size={14} />
              </button>
            </div>
          );
        })}

        <button
          onClick={() => setEditingGoal({ id: `goal_${Date.now()}`, title: "", endDate: "", targetKm: "", subtitle: "", icon: "🎯" })}
          style={{ flex: "0 0 auto", background: C.panel, border: `1px dashed ${C.slate}`, borderRadius: 8, padding: "18px 20px", color: C.chalkDim, fontFamily: bodyFont, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, minWidth: 140 }}
        >
          <Plus size={15} /> Doel toevoegen
        </button>
      </div>

      {editingGoal && (
        <GoalEditModal
          goal={editingGoal}
          onSave={handleSave}
          onDelete={goals.some((g) => g.id === editingGoal.id) ? handleDelete : null}
          onClose={() => setEditingGoal(null)}
          C={C}
        />
      )}
    </div>
  );
}
