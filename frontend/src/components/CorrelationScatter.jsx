import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from "recharts";
import { monoFont } from "../constants.js";

export default function CorrelationScatter({ data, xKey, yKey, xLabel, yLabel, C }) {
  if (!data.length) return <div style={{ color: C.chalkDim, fontSize: 13 }}>Onvoldoende data voor deze vergelijking.</div>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid stroke={C.slate} strokeOpacity={0.3} />
        <XAxis type="number" dataKey={xKey} name={xLabel} stroke={C.chalkDim} tick={{ fontFamily: monoFont, fontSize: 11 }} label={{ value: xLabel, position: "insideBottom", offset: -5, fill: C.chalkDim, fontSize: 11 }} />
        <YAxis type="number" dataKey={yKey} name={yLabel} stroke={C.chalkDim} tick={{ fontFamily: monoFont, fontSize: 11 }} width={40} reversed={yKey === "pace"} />
        <ZAxis range={[60, 60]} />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          contentStyle={{ background: C.ink, border: `1px solid ${C.slate}`, borderRadius: 6, fontFamily: monoFont, fontSize: 12 }}
          formatter={(value, name) => [value, name === xKey ? xLabel : yLabel]}
        />
        <Scatter data={data} fill={C.red} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
