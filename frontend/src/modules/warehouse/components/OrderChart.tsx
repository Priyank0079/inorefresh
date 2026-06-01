import { useState } from 'react';

interface OrderChartProps {
  title: string;
  data: { date: string; value: number }[];
  maxValue: number;
  height?: number;
}

export default function OrderChart({ title, data, maxValue }: OrderChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 flex items-center justify-center h-48">
        <p className="text-neutral-400 text-sm">No data available</p>
      </div>
    );
  }

  // Chart layout — generous left padding for Y-axis labels
  const W = 560;
  const H = 220;
  const pad = { top: 16, right: 20, bottom: 48, left: 52 };
  const gW = W - pad.left - pad.right;
  const gH = H - pad.top - pad.bottom;

  // Nice round Y-axis max (round up to nearest 5 if small, or 10 for larger)
  const rawMax = maxValue <= 0 ? 5 : maxValue;
  const step = rawMax <= 10 ? 1 : rawMax <= 50 ? 5 : 10;
  const chartMax = Math.ceil(rawMax / step) * step || step;

  // 5 Y-axis ticks (0, 25%, 50%, 75%, 100%)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(r => Math.round(chartMax * r));

  // Point positions
  const pts = data.map((d, i) => ({
    x: pad.left + (data.length === 1 ? gW / 2 : (i / (data.length - 1)) * gW),
    y: pad.top + gH - (d.value / chartMax) * gH,
    value: d.value,
    date: d.date,
    i,
  }));

  // Smooth line path (monotone cubic)
  const linePath = (() => {
    if (pts.length < 2) return `M${pts[0]?.x} ${pts[0]?.y}`;
    let d = `M${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const cx = (pts[i].x + pts[i + 1].x) / 2;
      d += ` C${cx} ${pts[i].y}, ${cx} ${pts[i + 1].y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
    }
    return d;
  })();

  const areaPath = `${linePath} L${pts[pts.length - 1].x} ${pad.top + gH} L${pts[0].x} ${pad.top + gH} Z`;

  // X-axis label density — show every Nth label to avoid overlap
  const labelStep = data.length <= 12 ? 1 : data.length <= 16 ? 2 : data.length <= 31 ? 3 : 4;

  const gradId = `wh-grad-${title.replace(/\W/g, '')}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-3">
      {/* Header */}
      <h3 className="text-sm font-bold text-neutral-800 mb-2 truncate">{title}</h3>

      {/* SVG Chart */}
      <div className="w-full">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
          style={{ display: 'block' }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {yTicks.map((v, idx) => {
            const y = pad.top + gH - (v / chartMax) * gH;
            return (
              <g key={idx}>
                <line
                  x1={pad.left} y1={y}
                  x2={pad.left + gW} y2={y}
                  stroke={idx === 0 ? '#9ca3af' : '#e5e7eb'}
                  strokeWidth={idx === 0 ? 1.5 : 1}
                  strokeDasharray={idx === 0 ? '' : '4 3'}
                />
                {/* Y-axis label — positioned with enough room */}
                <text
                  x={pad.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#6b7280"
                  fontWeight="500"
                >
                  {v}
                </text>
              </g>
            );
          })}

          {/* Left axis line */}
          <line
            x1={pad.left} y1={pad.top}
            x2={pad.left} y2={pad.top + gH}
            stroke="#9ca3af" strokeWidth="1.5"
          />

          {/* Area fill */}
          <path d={areaPath} fill={`url(#${gradId})`} />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#0d9488"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover vertical line */}
          {hoveredIndex !== null && (() => {
            const p = pts[hoveredIndex];
            return (
              <line
                x1={p.x} y1={pad.top}
                x2={p.x} y2={pad.top + gH}
                stroke="#0d9488" strokeWidth="1.5"
                strokeDasharray="4 3" opacity="0.6"
              />
            );
          })()}

          {/* Data points (only render meaningful ones to avoid clutter on 31-day charts) */}
          {pts.map((p) => {
            const show = data.length <= 15 || p.value > 0 || p.i === hoveredIndex;
            if (!show) return null;
            const hov = p.i === hoveredIndex;
            return (
              <circle
                key={p.i}
                cx={p.x} cy={p.y}
                r={hov ? 6 : p.value > 0 ? 4 : 2.5}
                fill={p.value > 0 ? '#0d9488' : '#d1fae5'}
                stroke="white"
                strokeWidth={hov ? 2.5 : 1.5}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(p.i)}
              />
            );
          })}

          {/* Invisible hover strips for each data point */}
          {pts.map((p) => (
            <rect
              key={`h${p.i}`}
              x={p.x - gW / (data.length * 2)}
              y={pad.top}
              width={gW / data.length}
              height={gH}
              fill="transparent"
              onMouseEnter={() => setHoveredIndex(p.i)}
            />
          ))}

          {/* X-axis labels */}
          {pts.map((p) => {
            if (p.i % labelStep !== 0 && p.i !== pts.length - 1) return null;
            return (
              <text
                key={p.i}
                x={p.x}
                y={pad.top + gH + 14}
                textAnchor="middle"
                fontSize={data.length > 20 ? '9' : '10'}
                fill="#6b7280"
                fontWeight="500"
              >
                {p.date}
              </text>
            );
          })}

          {/* Tooltip */}
          {hoveredIndex !== null && (() => {
            const p = pts[hoveredIndex];
            const ttW = 80;
            const ttH = 38;
            const ttX = Math.min(Math.max(p.x - ttW / 2, pad.left), pad.left + gW - ttW);
            const ttY = p.y - ttH - 8 < pad.top ? p.y + 8 : p.y - ttH - 8;
            return (
              <g>
                <rect
                  x={ttX} y={ttY} width={ttW} height={ttH}
                  rx="6" fill="white"
                  stroke="#0d9488" strokeWidth="1.5"
                  filter="drop-shadow(0 2px 6px rgba(0,0,0,0.12))"
                />
                <text x={ttX + ttW / 2} y={ttY + 13} textAnchor="middle" fontSize="9" fill="#6b7280">
                  {p.date}
                </text>
                <text x={ttX + ttW / 2} y={ttY + 28} textAnchor="middle" fontSize="13" fontWeight="700" fill="#0d9488">
                  {p.value}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Y-axis label */}
      <p className="text-[10px] text-neutral-400 text-center mt-0.5">Orders</p>
    </div>
  );
}
