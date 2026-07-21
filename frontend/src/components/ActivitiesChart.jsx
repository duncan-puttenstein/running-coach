import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { monoFont } from "../constants.js";
import { weekStartDate, fmtWeekLabel } from "../utils/format.js";
import { generateWeekSequence } from "../utils/dateRangeFilter.js";

export default function ActivitiesChart({ allRuns, range, C }) {
  const data = useMemo(() => {
    const weeks = generateWeekSequence(range?.key, range?.start, range?.end, allRuns);
    const counts = {};
    allRuns.forEach((r) => {
      const key = weekStartDate(r.date).toISOString().slice(0, 10);
      counts[key] = (counts[key] || 0) + 1;
    });
    return weeks.map((monday) => {
      const key = monday.toISOString().slice(0, 10);
      return { label: fmtWeekLabel(monday), count: counts[key] || 0 };
    });
  }, [allRuns, range]);

  if (!data.length) {
    return <div style={{ color: C.chalkDim, fontSize: 13 }}>Nog geen runs om te tonen.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ left: -10, right: 10 }}>
        <CartesianGrid stroke={C.slate} strokeOpacity={0.3} vertical={false} />
        <XAxis dataKey="label" stroke={C.chalkDim} tick={{ fontFamily: monoFont, fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis stroke={C.chalkDim} tick={{ fontFamily: monoFont, fontSize: 11 }} width={30} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: C.ink, border: `1px solid ${C.slate}`, borderRadius: 6, fontFamily: monoFont, fontSize: 12 }}
          labelStyle={{ color: C.chalkDim }}
          formatter={(value) => [value, "Activiteiten"]}
        />
        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={C.chalk} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
