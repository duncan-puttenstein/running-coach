import { bodyFont } from "../constants.js";

export default function RouteMap({ route, C }) {
  if (!route || route.length < 2) {
    return <div style={{ color: C.chalkDim, fontFamily: bodyFont, fontSize: 13 }}>Geen GPS-route beschikbaar voor deze run.</div>;
  }

  const lats = route.map((p) => p[0]);
  const lngs = route.map((p) => p[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 0.001;
  const lngRange = maxLng - minLng || 0.001;

  const width = 400, height = 260, padding = 20;
  const points = route.map(([lat, lng]) => {
    const x = padding + ((lng - minLng) / lngRange) * (width - padding * 2);
    // invert Y since latitude increases upward but SVG y increases downward
    const y = padding + (1 - (lat - minLat) / latRange) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const [startX, startY] = points[0].split(",");
  const [endX, endY] = points[points.length - 1].split(",");

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ background: C.ink, borderRadius: 8 }}>
        <polyline points={points.join(" ")} fill="none" stroke={C.red} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={startX} cy={startY} r="5" fill={C.gold} />
        <circle cx={endX} cy={endY} r="5" fill={C.chalk} />
      </svg>
      <div style={{ display: "flex", gap: 16, marginTop: 8, fontFamily: bodyFont, fontSize: 11, color: C.chalkDim }}>
        <span><span style={{ color: C.gold }}>●</span> start</span>
        <span><span style={{ color: C.chalk }}>●</span> finish</span>
      </div>
      <div style={{ marginTop: 6, fontFamily: bodyFont, fontSize: 11, color: C.chalkDim }}>
        Gestileerde routevorm op basis van GPS-data — geen echte kaart met straten.
      </div>
    </div>
  );
}
