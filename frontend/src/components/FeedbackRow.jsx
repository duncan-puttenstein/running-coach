import { bodyFont } from "../constants.js";

export default function FeedbackRow({ tone, text, C }) {
  const color = tone === "positive" ? C.gold : tone === "warning" ? C.red : C.slate;
  return (
    <div style={{ borderLeft: `3px solid ${color}`, paddingLeft: 12, marginBottom: 10, fontFamily: bodyFont, fontSize: 13, color: C.chalk, lineHeight: 1.5 }}>
      {text}
    </div>
  );
}
