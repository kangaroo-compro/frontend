import type { ReactNode } from 'react'

interface ParameterChartCardProps {
  icon: ReactNode
  label: string
  currentValue: string
  points: number[] // relative values 0-100
  timeLabels: string[]
}

export function ParameterChartCard({
  icon,
  label,
  currentValue,
  points,
  timeLabels,
}: ParameterChartCardProps) {
  const width = 460
  const height = 140
  const padLeft = 20
  const padRight = 20
  const padTop = 30
  const padBottom = 28

  const plotW = width - padLeft - padRight
  const plotH = height - padTop - padBottom

  // Convert points (0-100) to svg coordinates
  const svgPoints = points.map((val, idx) => {
    const x = padLeft + (idx / (points.length - 1)) * plotW
    const y = padTop + plotH - (val / 100) * plotH
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const pathD = `M${svgPoints.join(' L')}`
  const maxLimitY = padTop + 10

  return (
    <div className="flex flex-col justify-between rounded-xl border bg-card p-4 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="text-muted-foreground">{icon}</span>
          <span>{label}</span>
        </div>
        <div className="text-base font-bold text-foreground">{currentValue}</div>
      </div>

      {/* Responsive SVG Chart */}
      <div className="w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          aria-label={`${label} chart`}
        >
          {/* Dashed Max Limit Reference Line */}
          <line
            x1={padLeft}
            x2={width - padRight}
            y1={maxLimitY}
            y2={maxLimitY}
            className="stroke-muted-foreground/40"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <text
            x={width - padRight}
            y={maxLimitY + 14}
            textAnchor="end"
            className="fill-muted-foreground text-[10px] tracking-tight font-medium"
          >
            Max limit (to be set)
          </text>

          {/* Metric Polyline */}
          <path
            d={pathD}
            fill="none"
            className="stroke-foreground"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Time Labels */}
          {timeLabels.map((time, idx) => {
            const x = padLeft + (idx / (timeLabels.length - 1)) * plotW
            return (
              <text
                key={`${time}-${idx}`}
                x={x}
                y={height - 6}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px] tabular-nums"
              >
                {time}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
