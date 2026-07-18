import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { monoFont } from "../constants.js";

export default function EffortChart({ allRuns, C }) {
  const data = useMemo(
    () => allRuns
      .filter((r) => r.sufferScore != null)
      .map((r) => ({ name: `#${r.order}`, effort: r.sufferScore, type: r.type })),
    [allRuns]
  );

  const avg = data.length ? data.reduce((a, d) => a + d.effort, 0) / data.length : 0;

  if (!data.length) {
    return (
      <div style={{ color: C.chalkDim, fontSize: 13 }}>
        Nog geen Relative Effort-data — deze komt van Strava en vereist hartslagdata tijdens je runs.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ left: -10, right: 10 }}>
        <CartesianGrid stroke={C.slate} strokeOpacity={0.3} vertical={false} />
        <XAxis dataKey="name" stroke={C.chalkDim} tick={{ fontFamily: monoFont, fontSize: 11 }} />
        <YAxis stroke={C.chalkDim} tick={{ fontFamily: monoFont, fontSize: 11 }} width={35} />
        <Tooltip
          contentStyle={{ background: C.ink, border: `1px solid ${C.slate}`, borderRadius: 6, fontFamily: monoFont, fontSize: 12 }}
          labelStyle={{ color: C.chalkDim }}
          formatter={(value, name, props) => [value, `${props.payload.type} — Relative Effort`]}
        />
        <ReferenceLine
          y={avg}
          stroke={C.gold}
          strokeDasharray="4 4"
          label={{ value: `gem. ${avg.toFixed(0)}`, position: "right", fill: C.gold, fontSize: 11 }}
        />
        <Bar dataKey="effort" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.effort > avg * 1.3 ? C.red : d.effort < avg * 0.7 ? C.slate : C.chalk} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
