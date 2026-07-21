import { Zap } from "lucide-react";
import { bodyFont, displayFont } from "../constants.js";
import { currentPhase, fmtShortDate } from "../utils/format.js";
import InfoTooltip from "./InfoTooltip.jsx";

function getTodayStatus(daysSince) {
  if (daysSince === null) return { label: "Nog geen runs gelogd", tone: "neutral" };
  if (daysSince === 0) return { label: "Vandaag actief 💪", tone: "positive" };
  if (daysSince === 1) return { label: "Fris — klaar voor training", tone: "positive" };
  if (daysSince <= 3) return { label: "Goed hersteld — klaar voor een pittige sessie", tone: "positive" };
  return { label: "Lang niet getraind — bouw rustig weer op", tone: "warning" };
}

function getStatusExplanation(daysSince) {
  if (daysSince === null) return "Nog geen runs gelogd om een status te bepalen.";
  if (daysSince === 0) return "Je hebt vandaag al gelopen — dat telt als een actieve dag.";
  if (daysSince === 1) return "Je liep gisteren, dus je bent voldoende hersteld voor een nieuwe training.";
  if (daysSince <= 3) return `Het is ${daysSince} dagen geleden sinds je laatste run — genoeg hersteltijd voor een pittigere sessie.`;
  return `Het is al ${daysSince} dagen geleden sinds je laatste run — bouw rustig weer op in plaats van meteen vol te gaan.`;
}

function getShortRecommendation(daysSince, recentTypes, phase) {
  if (daysSince === null) return "Log je eerste run om een advies te krijgen.";
  if (daysSince >= 3) return "Aanbevolen: rustige Long Run om weer op te bouwen.";
  if (phase.n >= 2 && !recentTypes.includes("Interval")) return "Aanbevolen: Interval Run — richting je football-doel.";
  if (!recentTypes.includes("Tempo")) return "Aanbevolen: Tempo Run om je drempel te testen.";
  return "Aanbevolen: Long Run voor je aerobe basis.";
}

function getRecommendationExplanation(daysSince, recentTypes, phase) {
  if (daysSince === null) return "Nog geen trainingsgeschiedenis om een advies op te baseren.";
  if (daysSince >= 3) return "Je hebt een tijd niet getraind — een rustige Long Run helpt om weer op te bouwen zonder blessurerisico.";
  if (phase.n >= 2 && !recentTypes.includes("Interval")) return `Je zit in Fase ${phase.n} (${phase.label}), waarin intervaltraining prioriteit krijgt, en je hebt er recent geen gedaan.`;
  if (!recentTypes.includes("Tempo")) return "Je hebt recent geen tempotraining gedaan — dit test en verbetert je drempeltempo.";
  return "Op basis van je recente trainingen is dit een logische volgende stap voor je aerobe opbouw.";
}

export default function StatusPanel({ activeRuns, C }) {
  const sorted = [...activeRuns].sort((a, b) => new Date(a.date) - new Date(b.date));
  const lastRun = sorted[sorted.length - 1] || null;
  const daysSince = lastRun ? Math.floor((new Date() - new Date(lastRun.date)) / (1000 * 60 * 60 * 24)) : null;
  const phase = currentPhase();
  const status = getTodayStatus(daysSince);
  const recentTypes = sorted.slice(-3).map((r) => r.type);
  const recommendation = getShortRecommendation(daysSince, recentTypes, phase);

  const statusColor = status.tone === "positive" ? C.gold : status.tone === "warning" ? C.red : C.chalkDim;

  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 220px", background: C.panel, borderRadius: 8, padding: "16px 18px", borderLeft: `3px solid ${statusColor}` }}>
        <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.chalkDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
          Today's Status <InfoTooltip text={getStatusExplanation(daysSince)} C={C} />
        </div>
        <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 15, color: C.chalk }}>{status.label}</div>
      </div>

      <div style={{ flex: "1 1 200px", background: C.panel, borderRadius: 8, padding: "16px 18px", borderLeft: `3px solid ${C.slate}` }}>
        <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.chalkDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Days Since Last Run</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 24, color: C.chalk }}>{daysSince === null ? "—" : daysSince}</div>
          {lastRun && <div style={{ fontFamily: bodyFont, fontSize: 12, color: C.chalkDim }}>({fmtShortDate(lastRun.date)})</div>}
        </div>
      </div>

      <div style={{ flex: "1 1 260px", background: C.panel, borderRadius: 8, padding: "16px 18px", borderLeft: `3px solid ${C.red}` }}>
        <div style={{ fontFamily: bodyFont, fontSize: 11, color: C.chalkDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <Zap size={12} /> Recommended <InfoTooltip text={getRecommendationExplanation(daysSince, recentTypes, phase)} C={C} />
        </div>
        <div style={{ fontFamily: bodyFont, fontSize: 13, color: C.chalk, lineHeight: 1.4 }}>{recommendation}</div>
      </div>
    </div>
  );
}
