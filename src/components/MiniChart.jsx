/**
 * SmartInvoice Africa — MiniChart
 * Pure SVG charts: sparkline, bar, and bar-with-overlay.
 * Zero external dependencies.
 */

import { useState } from "react";

// ── SPARKLINE ─────────────────────────────────────────────────────────────────
export function Sparkline({ data = [], color = "#1A7A50", height = 40, width = 120, filled = true }) {
  if (!data.length) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const polyline = pts.join(" ");
  const area = `0,${height} ${polyline} ${width},${height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      {filled && (
        <polygon
          points={area}
          fill={color}
          fillOpacity={0.12}
        />
      )}
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Last point dot */}
      {pts.length > 0 && (() => {
        const last = pts[pts.length - 1].split(",");
        return (
          <circle cx={last[0]} cy={last[1]} r={3} fill={color} />
        );
      })()}
    </svg>
  );
}

// ── BAR CHART ─────────────────────────────────────────────────────────────────
export function BarChart({
  revenueData = [],
  expenseData = [],
  labels = [],
  height = 180,
  sym = "₦",
  showOverlay = false,
}) {
  const [tooltip, setTooltip] = useState(null);

  const allVals = [...revenueData, ...expenseData];
  const maxVal = Math.max(...allVals, 1);

  const BAR_W = 14;
  const GAP = 4;
  const GROUP_W = BAR_W * 2 + GAP + 12;
  const CHART_H = height - 28; // reserve bottom for labels

  const fmt = (n) => `${sym} ${(n / 1000000).toFixed(2)}M`;

  return (
    <div style={{ position: "relative" }}>
      <svg
        width="100%"
        viewBox={`0 0 ${labels.length * GROUP_W} ${height}`}
        style={{ overflow: "visible" }}
      >
        {/* Horizontal guide lines */}
        {[0.25, 0.5, 0.75, 1].map((pct) => {
          const y = CHART_H - pct * CHART_H;
          return (
            <g key={pct}>
              <line
                x1={0} y1={y} x2={labels.length * GROUP_W} y2={y}
                stroke="#E2DAC8" strokeWidth={1} strokeDasharray="4 4"
              />
              <text x={0} y={y - 3} fill="#6B6455" fontSize={8}>
                {fmt(maxVal * pct)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {labels.map((label, i) => {
          const x = i * GROUP_W + 6;
          const revH = (revenueData[i] / maxVal) * CHART_H;
          const expH = (expenseData[i] / maxVal) * CHART_H;

          return (
            <g key={label}>
              {/* Revenue bar */}
              <rect
                x={x}
                y={CHART_H - revH}
                width={BAR_W}
                height={Math.max(revH, 3)}
                rx={3}
                fill="#1A4A35"
                style={{ cursor: "pointer", transition: "opacity .15s" }}
                onMouseEnter={() =>
                  setTooltip({ x: x + BAR_W / 2, y: CHART_H - revH - 8, label, type: "Revenue", val: revenueData[i] })
                }
                onMouseLeave={() => setTooltip(null)}
              />
              {/* Expense bar */}
              <rect
                x={x + BAR_W + GAP}
                y={CHART_H - expH}
                width={BAR_W}
                height={Math.max(expH, 3)}
                rx={3}
                fill="#C4522A"
                style={{ cursor: "pointer", transition: "opacity .15s" }}
                onMouseEnter={() =>
                  setTooltip({ x: x + BAR_W + GAP + BAR_W / 2, y: CHART_H - expH - 8, label, type: "Expense", val: expenseData[i] })
                }
                onMouseLeave={() => setTooltip(null)}
              />

              {/* Profit overlay dot */}
              {showOverlay && (() => {
                const profit = revenueData[i] - expenseData[i];
                const profitH = (profit / maxVal) * CHART_H;
                const cy = CHART_H - profitH;
                return (
                  <circle
                    cx={x + BAR_W + GAP / 2}
                    cy={cy}
                    r={4}
                    fill={profit >= 0 ? "#E8A020" : "#C4522A"}
                    stroke="#fff"
                    strokeWidth={1.5}
                    onMouseEnter={() =>
                      setTooltip({ x: x + BAR_W, y: cy - 8, label, type: "Profit", val: profit })
                    }
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })()}

              {/* Label */}
              <text
                x={x + BAR_W + GAP / 2}
                y={CHART_H + 14}
                textAnchor="middle"
                fill="#6B6455"
                fontSize={9.5}
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Profit line connecting dots */}
        {showOverlay && revenueData.length > 1 && (() => {
          const pts = revenueData.map((rev, i) => {
            const profit = rev - expenseData[i];
            const x = i * GROUP_W + 6 + BAR_W + GAP / 2;
            const y = CHART_H - (profit / maxVal) * CHART_H;
            return `${x},${y}`;
          });
          return (
            <polyline
              points={pts.join(" ")}
              fill="none"
              stroke="#E8A020"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              strokeLinecap="round"
            />
          );
        })()}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: `${(tooltip.x / (labels.length * GROUP_W)) * 100}%`,
            top: tooltip.y,
            transform: "translateX(-50%) translateY(-100%)",
            background: "#1A4A35",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: 7,
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,.2)",
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 10, opacity: 0.7 }}>{tooltip.label} · {tooltip.type}</div>
          <div>{sym} {Math.abs(tooltip.val).toLocaleString("en-NG")}</div>
        </div>
      )}
    </div>
  );
}
