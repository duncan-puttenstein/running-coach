import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { monoFont, bodyFont } from "../constants.js";

const TYPE_COLORS = { Long: "#EDE7DA", Tempo: "#C81D25", Interval: "#D9A544", Test: "#9AA5B8" };

export default function TrainingDistributionPie({ runs, C }) {
  const data = Object.values(
    runs.reduce((acc, r) => {
      if (!acc[r.type]) acc[r.type] = { name: r.type, value: 0 };
      acc[r.type].value += 1;
      return acc;
    }, {})
  );

  if (!data.length) return <div style={{ color: C.chalkDim, fontSize: 13 }}>Nog geen data.</div>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={{ fontFamily: monoFont, fontSize: 11, fill: C.chalk }}>
          {data.map((d, i) => <Cell key={i} fill={TYPE_COLORS[d.name] || C.slate} />)}
        </Pie>
        <Tooltip contentStyle={{ background: C.ink, border: `1px solid ${C.slate}`, borderRadius: 6, fontFamily: monoFont, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontFamily: bodyFont, fontSize: 12, color: C.chalkDim }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
