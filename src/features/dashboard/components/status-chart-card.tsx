import { Power } from 'lucide-react'

interface StatusChartCardProps {
  timeLabels: string[]
}

export function StatusChartCard({ timeLabels }: StatusChartCardProps) {
  const width = 460
  const height = 140
  const padLeft = 32
  const padRight = 20
  const plotW = width - padLeft - padRight

  const onY = 48
  const offY = 100

  return (
    <div className="flex flex-col justify-between rounded-xl border bg-card p-4 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Power className="size-4 text-muted-foreground stroke-[2.2]" aria-hidden />
          <span>Machine status</span>
        </div>
        <div className="text-base font-bold text-foreground">ON</div>
      </div>

      {/* Responsive Binary Status Chart */}
      <div className="w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          aria-label="Machine status chart"
        >
          {/* Level Markers & Guides */}
          {/* ON Level */}
          <text
            x={padLeft - 6}
            y={onY - 6}
            textAnchor="end"
            className="fill-foreground text-[10px] font-bold tabular-nums"
          >
            ON
          </text>
          <line
            x1={padLeft}
            x2={width - padRight}
            y1={onY}
            y2={onY}
            className="stroke-foreground"
            strokeWidth={2.5}
            strokeLinecap="round"
          />

          {/* OFF Level */}
          <text
            x={padLeft - 6}
            y={offY + 4}
            textAnchor="end"
            className="fill-muted-foreground text-[10px] font-medium tabular-nums"
          >
            OFF
          </text>
          <line
            x1={padLeft}
            x2={width - padRight}
            y1={offY}
            y2={offY}
            className="stroke-muted-foreground/30"
            strokeWidth={1}
            strokeLinecap="round"
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
