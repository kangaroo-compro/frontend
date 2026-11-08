import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { Power } from 'lucide-react'
import { NO_VALUE } from '@/lib/format'

export type StatusPoint = { t: number; status: 'ON' | 'OFF' }

interface ParameterStatusChartProps {
  latestStatus?: 'ON' | 'OFF'
  points: StatusPoint[]
  windowMs?: number
  /** Right edge of the time axis (epoch ms); defaults to the last point. */
  endMs?: number
}

const PAD = { left: 34, right: 24, top: 28, bottom: 24 }
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

export function ParameterStatusChart({
  latestStatus,
  points,
  windowMs,
  endMs,
}: ParameterStatusChartProps) {
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
  const end = endMs ?? last?.t ?? 0
  const duration = windowMs ?? Math.max(end - (points[0]?.t ?? end), 60_000)
  const start = end - duration

  const plotW = Math.max(width - PAD.left - PAD.right, 1)

  const onY = PAD.top + 25
  const offY = PAD.top + 85

  const x = (t: number) => PAD.left + Math.max(0, Math.min(1, (t - start) / duration)) * plotW
  const y = (status: 'ON' | 'OFF') => (status === 'ON' ? onY : offY)

  const visible = points.filter((p) => p.t >= start)

  // Build step-line path: horizontal then vertical
  let stepPath = ''
  visible.forEach((p, i) => {
    const currX = x(p.t).toFixed(1)
    const currY = y(p.status).toFixed(1)
    if (i === 0) {
      stepPath += `M${currX},${currY}`
    } else {
      const prev = visible[i - 1]
      const prevY = prev ? y(prev.status).toFixed(1) : currY
      stepPath += ` L${currX},${prevY} L${currX},${currY}`
    }
  })

  // Extend line to the rightmost edge if last point exists
  if (visible.length && last) {
    stepPath += ` L${(PAD.left + plotW).toFixed(1)},${y(last.status).toFixed(1)}`
  }

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

  const tickCount = 7
  const xTicks = Array.from({ length: tickCount }, (_, i) => start + (duration / (tickCount - 1)) * i)

  return (
    <div className="flex flex-col gap-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Power className="size-4 text-muted-foreground stroke-[2.2]" aria-hidden />
          <span>Machine status</span>
        </div>
        <div className="text-base font-bold text-foreground">{latestStatus ?? NO_VALUE}</div>
      </div>

      {/* Interactive Responsive SVG Area */}
      <div
        ref={box}
        className="relative w-full rounded-md outline-none focus-visible:ring-1 focus-visible:ring-ring"
        tabIndex={0}
        role="img"
        aria-label={`Machine status chart, current ${latestStatus ?? 'unknown'}`}
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
          {/* Level Markers & Track Guides */}
          {/* ON Level */}
          <text
            x={PAD.left - 6}
            y={onY + 3.5}
            textAnchor="end"
            className="fill-foreground text-[10px] font-bold tabular-nums"
          >
            ON
          </text>
          <line
            x1={PAD.left}
            x2={PAD.left + plotW}
            y1={onY}
            y2={onY}
            className="stroke-muted-foreground/20"
            strokeWidth={1}
          />

          {/* OFF Level */}
          <text
            x={PAD.left - 6}
            y={offY + 3.5}
            textAnchor="end"
            className="fill-muted-foreground text-[10px] font-medium tabular-nums"
          >
            OFF
          </text>
          <line
            x1={PAD.left}
            x2={PAD.left + plotW}
            y1={offY}
            y2={offY}
            className="stroke-muted-foreground/20"
            strokeWidth={1}
          />

          {/* Step Line */}
          {stepPath && (
            <path
              d={stepPath}
              fill="none"
              className="stroke-foreground"
              strokeWidth={2.4}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {points.length === 0 && (
            <text
              x={PAD.left + plotW / 2}
              y={PAD.top + PLOT_HEIGHT / 2}
              textAnchor="middle"
              className="fill-muted-foreground text-xs"
            >
              No data yet
            </text>
          )}

          {/* Time Labels */}
          {points.length > 0 && xTicks.map((t, idx) => {
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

          {/* Active Hover Marker */}
          {hovered && (
            <>
              <line
                x1={x(hovered.t)}
                x2={x(hovered.t)}
                y1={PAD.top}
                y2={PAD.top + PLOT_HEIGHT}
                className="stroke-muted-foreground/40"
                strokeWidth={1}
                strokeDasharray="2 2"
              />
              <circle
                cx={x(hovered.t)}
                cy={y(hovered.status)}
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
              left: Math.max(10, Math.min(x(hovered.t) - 40, width - 110)),
            }}
          >
            <div className="font-semibold">{hovered.status}</div>
            <div className="text-[10px] text-muted-foreground tabular-nums">
              {formatClockFull(hovered.t)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
