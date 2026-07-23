import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { monoFont } from "../constants.js";

export default function HeartRateAnalysisChart({ data, C }) {
  if (!data.length) {
    return <div style={{ color: C.chalkDim, fontSize: 13 }}>Geen hartslagdata beschikbaar in deze periode.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data.map((d) => ({ name: `#${d.order}`, hr: d.hr, type: d.type }))} margin={{ left: -10, right: 10 }}>
        <CartesianGrid stroke={C.slate} strokeOpacity={0.3} vertical={false} />
        <XAxis dataKey="name" stroke={C.chalkDim} tick={{ fontFamily: monoFont, fontSize: 11 }} />
        <YAxis stroke={C.chalkDim} tick={{ fontFamily: monoFont, fontSize: 11 }} width={35} domain={["dataMin - 5", "dataMax + 5"]} />
        <Tooltip
          contentStyle={{ background: C.ink, border: `1px solid ${C.slate}`, borderRadius: 6, fontFamily: monoFont, fontSize: 12 }}
          labelStyle={{ color: C.chalkDim }}
          formatter={(value, name, props) => [`${value} bpm`, props.payload.type]}
        />
        <Line type="monotone" dataKey="hr" stroke={C.red} strokeWidth={2} dot={{ fill: C.gold, r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
