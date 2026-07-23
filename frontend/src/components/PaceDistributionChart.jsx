import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { monoFont } from "../constants.js";

export default function PaceDistributionChart({ buckets, C }) {
  if (!buckets.length) return <div style={{ color: C.chalkDim, fontSize: 13 }}>Nog geen data.</div>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={buckets} margin={{ left: -10, right: 10 }}>
        <CartesianGrid stroke={C.slate} strokeOpacity={0.3} vertical={false} />
        <XAxis dataKey="label" stroke={C.chalkDim} tick={{ fontFamily: monoFont, fontSize: 10 }} />
        <YAxis stroke={C.chalkDim} tick={{ fontFamily: monoFont, fontSize: 11 }} width={30} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: C.ink, border: `1px solid ${C.slate}`, borderRadius: 6, fontFamily: monoFont, fontSize: 12 }}
          labelStyle={{ color: C.chalkDim }}
          formatter={(value) => [value, "Runs"]}
        />
        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
          {buckets.map((_, i) => <Cell key={i} fill={C.red} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
