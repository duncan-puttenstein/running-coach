import { bodyFont } from "../constants.js";
import FeedbackRow from "./FeedbackRow.jsx";

export default function TrendInsights({ insights, C }) {
  if (!insights.length) {
    return <div style={{ color: C.chalkDim, fontFamily: bodyFont, fontSize: 13 }}>Nog geen inzichten beschikbaar.</div>;
  }
  return (
    <div>
      {insights.map((ins, i) => <FeedbackRow key={i} tone={ins.tone} text={ins.text} C={C} />)}
      <div style={{ marginTop: 10, fontFamily: bodyFont, fontSize: 11, color: C.chalkDim }}>
        Automatisch gegenereerd op basis van vaste regels — geen live AI-model.
      </div>
    </div>
  );
}
