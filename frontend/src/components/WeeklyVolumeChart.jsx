import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { monoFont } from "../constants.js";
import { weekStartDate, fmtWeekLabel } from "../utils/format.js";

export default function WeeklyVolumeChart({ allRuns, C }) {
  const data = useMemo(() => {
    const weeks = {};
    allRuns.forEach((r) => {
      const monday = weekStartDate(r.date);
      const key = monday.toISOString().slice(0, 10);
      if (!weeks[key]) weeks[key] = { key, date: monday, km: 0 };
      weeks[key].km += r.distance;
    });
    return Object.values(weeks)
      .sort((a, b) => a.date - b.date)
      .map((w) => ({ label: fmtWeekLabel(w.date), km: +w.km.toFixed(1) }));
  }, [allRuns]);

  if (!data.length) {
    return <div style={{ color: C.chalkDim, fontSize: 13 }}>Nog geen runs om weekvolume te tonen.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ left: -10, right: 10 }}>
        <CartesianGrid stroke={C.slate} strokeOpacity={0.3} vertical={false} />
        <XAxis dataKey="label" stroke={C.chalkDim} tick={{ fontFamily: monoFont, fontSize: 11 }} />
        <YAxis stroke={C.chalkDim} tick={{ fontFamily: monoFont, fontSize: 11 }} width={35} />
        <Tooltip
          contentStyle={{ background: C.ink, border: `1px solid ${C.slate}`, borderRadius: 6, fontFamily: monoFont, fontSize: 12 }}
          labelStyle={{ color: C.chalkDim }}
          formatter={(value) => [`${value} km`, "Weekvolume"]}
        />
        <Bar dataKey="km" radius={[3, 3, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={C.red} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
