import { useState } from 'react';

// Simple equirectangular projection helper (lat/lon -> x/y on a 1000x500 viewBox).
function project(lat, lon) {
  const x = (lon + 180) * (1000 / 360);
  const y = (90 - lat) * (500 / 180);
  return { x, y };
}

const HQ_COORDS = { lat: 39.9612, lon: -82.9988 }; // Columbus, OH - company HQ, used as attack destination

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

export default function AttackMap({ indicators = [] }) {
  const [hovered, setHovered] = useState(null);
  const hq = project(HQ_COORDS.lat, HQ_COORDS.lon);

  const geolocated = indicators.filter((i) => i.latitude != null && i.longitude != null);

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox="0 0 1000 500" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <rect x="0" y="0" width="1000" height="500" fill="#0b1220" />
        {/* Simplified graticule background to suggest a world map without copyrighted geometry */}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`v${i}`} x1={(i + 1) * (1000 / 13)} y1="0" x2={(i + 1) * (1000 / 13)} y2="500" stroke="#152040" strokeWidth="1" />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={(i + 1) * (500 / 7)} x2="1000" y2={(i + 1) * (500 / 7)} stroke="#152040" strokeWidth="1" />
        ))}

        {/* Attack vectors: curved lines from threat source to HQ */}
        {geolocated.map((ind) => {
          const src = project(ind.latitude, ind.longitude);
          const midX = (src.x + hq.x) / 2;
          const midY = Math.min(src.y, hq.y) - 40;
          const color = SEVERITY_COLORS[ind.severity] || '#0ea5e9';
          return (
            <path
              key={ind.id}
              d={`M ${src.x} ${src.y} Q ${midX} ${midY} ${hq.x} ${hq.y}`}
              fill="none"
              stroke={color}
              strokeWidth={hovered === ind.id ? 2.4 : 1.2}
              strokeOpacity={hovered && hovered !== ind.id ? 0.15 : 0.65}
              strokeDasharray="4 3"
            />
          );
        })}

        {/* HQ marker */}
        <circle cx={hq.x} cy={hq.y} r="7" fill="#0ea5e9" stroke="#04141f" strokeWidth="2" />
        <circle cx={hq.x} cy={hq.y} r="14" fill="none" stroke="#0ea5e9" strokeWidth="1" opacity="0.4" />
        <text x={hq.x + 12} y={hq.y - 8} fill="#e6ebf5" fontSize="11" fontWeight="600">
          Columbus HQ
        </text>

        {/* Threat source markers */}
        {geolocated.map((ind) => {
          const p = project(ind.latitude, ind.longitude);
          const color = SEVERITY_COLORS[ind.severity] || '#0ea5e9';
          return (
            <g
              key={ind.id}
              onMouseEnter={() => setHovered(ind.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={p.x} cy={p.y} r={hovered === ind.id ? 7 : 5} fill={color} stroke="#0b1220" strokeWidth="1.5" />
            </g>
          );
        })}
      </svg>

      {hovered &&
        geolocated
          .filter((i) => i.id === hovered)
          .map((ind) => (
            <div
              key={ind.id}
              style={{
                position: 'absolute',
                bottom: 10,
                left: 10,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 12.5,
                maxWidth: 320,
                boxShadow: 'var(--shadow-elevated)',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                {ind.indicatorValue} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({ind.indicatorType})</span>
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                {ind.threatActor || 'Unattributed'} &middot; {ind.countryOfOrigin || 'Unknown origin'}
              </div>
            </div>
          ))}

      <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
        {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
          <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            <span style={{ textTransform: 'capitalize' }}>{sev}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
