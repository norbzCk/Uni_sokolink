import type { InventoryTrendPoint } from '../api/marketplace';

const CHART_WIDTH = 760;
const CHART_HEIGHT = 220;
const CHART_PADDING = { top: 16, right: 12, bottom: 32, left: 38 };

function compactNumber(value: number) {
  if (value >= 1000) {
    return (value / 1000).toFixed(value % 1000 === 0 ? 0 : 1) + 'k';
  }
  return String(value);
}

export function TrendChart({ points }: { points: InventoryTrendPoint[] }) {
  const max = Math.max(1, ...points.flatMap((point) => [point.stockIn, point.stockOut]));
  const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const slot = points.length > 0 ? plotWidth / points.length : plotWidth;
  const barWidth = Math.max(3, Math.min(14, slot / 3));
  const labelStep = Math.max(1, Math.ceil(points.length / 8));

  return (
    <div className="chart-wrap">
      {points.length === 0 ? (
        <p className="muted">No movement data for this period.</p>
      ) : (
        <svg
          className="trend-chart"
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          role="img"
          aria-label="Stock in and stock out by day"
        >
          {[0, 1, 2, 3, 4].map((line) => {
            const ratio = line / 4;
            const y = CHART_PADDING.top + plotHeight - plotHeight * ratio;
            return (
              <g key={line}>
                <line
                  x1={CHART_PADDING.left}
                  x2={CHART_WIDTH - CHART_PADDING.right}
                  y1={y}
                  y2={y}
                  className="chart-grid-line"
                />
                <text x={CHART_PADDING.left - 8} y={y + 4} className="chart-axis-label" textAnchor="end">
                  {compactNumber(Math.round(max * ratio))}
                </text>
              </g>
            );
          })}
          {points.map((point, index) => {
            const center = CHART_PADDING.left + slot * index + slot / 2;
            const inHeight = (point.stockIn / max) * plotHeight;
            const outHeight = (point.stockOut / max) * plotHeight;
            const base = CHART_PADDING.top + plotHeight;
            return (
              <g key={point.date}>
                {point.stockIn > 0 ? (
                  <rect
                    x={center - barWidth - 1}
                    y={base - inHeight}
                    width={barWidth}
                    height={Math.max(inHeight, 1)}
                    rx="3"
                    className="chart-bar-in"
                  >
                    <title>{`${point.label}: ${point.stockIn} units in`}</title>
                  </rect>
                ) : null}
                {point.stockOut > 0 ? (
                  <rect
                    x={center + 1}
                    y={base - outHeight}
                    width={barWidth}
                    height={Math.max(outHeight, 1)}
                    rx="3"
                    className="chart-bar-out"
                  >
                    <title>{`${point.label}: ${point.stockOut} units out`}</title>
                  </rect>
                ) : null}
                {index % labelStep === 0 || index === points.length - 1 ? (
                  <text
                    x={center}
                    y={CHART_HEIGHT - 10}
                    className="chart-axis-label"
                    textAnchor="middle"
                  >
                    {point.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

export function StockHealthDonut({
  healthy,
  low,
  out,
}: {
  healthy: number;
  low: number;
  out: number;
}) {
  const segments = [
    { label: 'Healthy', value: healthy, color: 'var(--green-600)' },
    { label: 'Low stock', value: low, color: 'var(--amber-500)' },
    { label: 'Out of stock', value: out, color: 'var(--coral-500)' },
  ];
  const total = healthy + low + out;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="donut-layout">
      <svg
        className="stock-donut"
        viewBox="0 0 120 120"
        role="img"
        aria-label={`${total} products: ${healthy} healthy, ${low} low stock, ${out} out of stock`}
      >
        <circle cx="60" cy="60" r={radius} className="donut-track" />
        <g transform="rotate(-90 60 60)">
          {segments.map((segment) => {
            if (segment.value <= 0 || total <= 0) return null;
            const length = (segment.value / total) * circumference;
            const segmentOffset = offset;
            offset += length;
            return (
              <circle
                key={segment.label}
                cx="60"
                cy="60"
                r={radius}
                className="donut-segment"
                stroke={segment.color}
                strokeDasharray={`${Math.max(length - 2, 1)} ${circumference - Math.max(length - 2, 1)}`}
                strokeDashoffset={-segmentOffset}
              >
                <title>{`${segment.label}: ${segment.value}`}</title>
              </circle>
            );
          })}
        </g>
        <text x="60" y="58" className="donut-value" textAnchor="middle">
          {total}
        </text>
        <text x="60" y="73" className="donut-caption" textAnchor="middle">
          products
        </text>
      </svg>
      <ul className="donut-legend">
        {segments.map((segment) => (
          <li key={segment.label}>
            <span className="legend-dot" style={{ background: segment.color }} aria-hidden="true" />
            <span>{segment.label}</span>
            <strong>{segment.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RankedBars({
  items,
}: {
  items: Array<{ id: string; label: string; value: number; detail: string }>;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  if (items.length === 0) {
    return <p className="muted">No product movement recorded in this period.</p>;
  }
  return (
    <ol className="ranked-bars">
      {items.map((item) => (
        <li key={item.id}>
          <div className="ranked-bar-head">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
          <div className="bar-track" aria-hidden="true">
            <span style={{ width: `${Math.max((item.value / max) * 100, item.value > 0 ? 4 : 0)}%` }} />
          </div>
          <span className="muted ranked-bar-detail">{item.detail}</span>
        </li>
      ))}
    </ol>
  );
}
