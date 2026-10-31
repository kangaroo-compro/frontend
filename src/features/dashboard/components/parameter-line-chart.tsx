import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'

export type Point = { t: number; v: number }

interface ParameterLineChartProps {
  title: string
  icon: ReactNode
  latestValue: string
  points: Point[]
  unit: string
  windowMs?: number
  maxLimitLabel?: string
  yMin?: number
  yMax?: number
}

const PAD = { left: 24, right: 24, top: 28, bottom: 24 }
const PLOT_HEIGHT = 120
const HEIGHT = PAD.top + PLOT_HEIGHT + PAD.bottom

function formatClockShort(epochMs: number): string {
  const d = new Date(epochMs)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function formatClockFull(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function ParameterLineChart({
  title,
  icon,
  latestValue,
  points,
  unit,
  windowMs,
  maxLimitLabel = 'Max limit (to be set)',
  yMin: customMin,
  yMax: customMax,
}: ParameterLineChartProps) {
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(500)
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0) {
        setWidth(entry.contentRect.width)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const last = points.at(-1)
  const end = last?.t ?? 0
  const duration = windowMs ?? Math.max(end - (points[0]?.t ?? end), 60_000)
  const start = end - duration

  const values = points.map((p) => p.v)
  const minVal = customMin ?? Math.min(...values, 0)
  const maxVal = customMax ?? Math.max(...values, minVal + 1)
  const range = Math.max(maxVal - minVal, 1)

  const plotW = Math.max(width - PAD.left - PAD.right, 1)

  const x = (t: number) => PAD.left + Math.max(0, Math.min(1, (t - start) / duration)) * plotW
  const y = (v: number) => PAD.top + PLOT_HEIGHT - (Math.min(Math.max(v, minVal), maxVal) - minVal) / range * PLOT_HEIGHT
  const baseline = PAD.top + PLOT_HEIGHT

  const visible = points.filter((p) => p.t >= start)
  const line = visible.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join('')
  const first = visible[0]
  const area =
    first && last
      ? `${line}L${x(last.t).toFixed(1)},${baseline}L${x(first.t).toFixed(1)},${baseline}Z`
      : ''

  const hovered = active === null ? undefined : visible[active]

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!visible.length) return
    const rect = e.currentTarget.getBoundingClientRect()
    const t = start + ((e.clientX - rect.left - PAD.left) / plotW) * duration
    let nearest = 0
    visible.forEach((p, i) => {
      if (Math.abs(p.t - t) < Math.abs((visible[nearest]?.t ?? 0) - t)) nearest = i
    })
    setActive(nearest)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!visible.length) return
    const lastIndex = visible.length - 1
    if (e.key === 'ArrowLeft') setActive((i) => Math.max((i ?? lastIndex + 1) - 1, 0))
    else if (e.key === 'ArrowRight') setActive((i) => Math.min((i ?? lastIndex - 1) + 1, lastIndex))
    else if (e.key === 'Escape') setActive(null)
    else return
    e.preventDefault()
  }

  // Ticks along the X axis (7 timestamps like the wireframe)
  const tickCount = 7
  const xTicks = Array.from({ length: tickCount }, (_, i) => start + (duration / (tickCount - 1)) * i)
  const maxLimitY = PAD.top + 8

  return (
    <div className="flex flex-col justify-between rounded-xl border bg-card p-4 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="text-muted-foreground">{icon}</span>
          <span>{title}</span>
        </div>
        <div className="text-base font-bold text-foreground tabular-nums">{latestValue}</div>
      </div>

      {/* Interactive Responsive SVG Area */}
      <div
        ref={box}
        className="relative w-full rounded-md outline-none focus-visible:ring-1 focus-visible:ring-ring"
        tabIndex={0}
        role="img"
        aria-label={`${title} chart, current ${latestValue}`}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
      >
        <svg
          width={width}
          height={HEIGHT}
          className="block touch-none select-none overflow-visible"
          onPointerMove={onPointerMove}
          onPointerLeave={() => setActive(null)}
        >
          {/* Dashed Max Limit Reference Line */}
          <line
            x1={PAD.left}
            x2={PAD.left + plotW}
            y1={maxLimitY}
            y2={maxLimitY}
            className="stroke-muted-foreground/40"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <text
            x={PAD.left + plotW}
            y={maxLimitY + 12}
            textAnchor="end"
            className="fill-muted-foreground text-[10px] tracking-tight font-medium"
          >
            {maxLimitLabel}
          </text>

          {/* Area Fill */}
          {area && <path d={area} className="fill-foreground/5" />}

          {/* Line Path */}
          {line && (
            <path
              d={line}
              fill="none"
              className="stroke-foreground"
              strokeWidth={1.8}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* X Axis Time Labels */}
          {xTicks.map((t, idx) => {
            const posX = x(t)
            let anchor: 'start' | 'middle' | 'end' = 'middle'
            if (idx === 0) anchor = 'start'
            else if (idx === tickCount - 1) anchor = 'end'

            return (
              <text
                key={idx}
                x={posX}
                y={HEIGHT - 6}
                textAnchor={anchor}
                className="fill-muted-foreground text-[10px] tabular-nums"
              >
                {formatClockShort(t)}
              </text>
            )
          })}

          {/* Latest Point Indicator */}
          {last && !hovered && (
            <circle cx={x(last.t)} cy={y(last.v)} r={3.5} className="fill-foreground stroke-card" strokeWidth={1.5} />
          )}

          {/* Active Hover Crosshair */}
          {hovered && (
            <>
              <line
                x1={x(hovered.t)}
                x2={x(hovered.t)}
                y1={PAD.top}
                y2={baseline}
                className="stroke-muted-foreground/40"
                strokeWidth={1}
                strokeDasharray="2 2"
              />
              <circle
                cx={x(hovered.t)}
                cy={y(hovered.v)}
                r={4}
                className="fill-foreground stroke-card"
                strokeWidth={2}
              />
            </>
          )}
        </svg>

        {/* Hover Tooltip Card */}
        {hovered && (
          <div
            className="pointer-events-none absolute top-1 z-20 rounded-md border bg-popover px-2.5 py-1 text-xs text-popover-foreground shadow-sm"
            style={{
              left: Math.max(10, Math.min(x(hovered.t) - 45, width - 110)),
            }}
          >
            <div className="font-semibold tabular-nums">
              {hovered.v} {unit}
            </div>
            <div className="text-[10px] text-muted-foreground tabular-nums">
              {formatClockFull(hovered.t)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
