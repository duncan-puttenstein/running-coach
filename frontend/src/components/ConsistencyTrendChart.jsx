import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { monoFont } from "../constants.js";

export default function ConsistencyTrendChart({ data, C }) {
  if (!data.length) return <div style={{ color: C.chalkDim, fontSize: 13 }}>Nog geen data.</div>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data.map((d) => ({ name: `#${d.order}`, variance: Math.round(d.variance), type: d.type }))} margin={{ left: -10, right: 10 }}>
        <CartesianGrid stroke={C.slate} strokeOpacity={0.3} vertical={false} />
        <XAxis dataKey="name" stroke={C.chalkDim} tick={{ fontFamily: monoFont, fontSize: 11 }} />
        <YAxis stroke={C.chalkDim} tick={{ fontFamily: monoFont, fontSize: 11 }} width={35} />
        <Tooltip
          contentStyle={{ background: C.ink, border: `1px solid ${C.slate}`, borderRadius: 6, fontFamily: monoFont, fontSize: 12 }}
          labelStyle={{ color: C.chalkDim }}
          formatter={(value, name, props) => [`${value}s variantie`, props.payload.type]}
        />
        <Line type="monotone" dataKey="variance" stroke={C.gold} strokeWidth={2} dot={{ fill: C.red, r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
