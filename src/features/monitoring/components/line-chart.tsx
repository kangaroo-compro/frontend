import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatClock } from '@/lib/format'

export type Point = { t: number; v: number }

type LineChartProps = {
  title: string
  description: string
  points: Point[]
  /** Visible time span ending at the newest point, in ms. */
  windowMs: number
  yMax: number
  yTicks: number[]
  format: (v: number) => string
}

const PAD = { left: 48, right: 64, top: 12, bottom: 24 }
const PLOT_HEIGHT = 140
const HEIGHT = PAD.top + PLOT_HEIGHT + PAD.bottom

/**
 * Single-series time line: 2px line, 10% area wash, end dot + end label,
 * hairline grid, crosshair tooltip on hover and on arrow keys.
 */
export function LineChart({ title, description, points, windowMs, yMax, yTicks, format }: LineChartProps) {
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => entry && setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const last = points.at(-1)
  const end = last?.t ?? 0
  const start = end - windowMs
  const plotW = Math.max(width - PAD.left - PAD.right, 1)
  const x = (t: number) => PAD.left + ((t - start) / windowMs) * plotW
  const y = (v: number) => PAD.top + PLOT_HEIGHT - (Math.min(Math.max(v, 0), yMax) / yMax) * PLOT_HEIGHT
  const baseline = PAD.top + PLOT_HEIGHT

  const visible = points.filter((p) => p.t >= start)
  const line = visible.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join('')
  const first = visible[0]
  const area = first && last ? `${line}L${x(last.t).toFixed(1)},${baseline}L${x(first.t).toFixed(1)},${baseline}Z` : ''
  const hovered = active === null ? undefined : visible[active]

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!visible.length) return
    const rect = e.currentTarget.getBoundingClientRect()
    const t = start + ((e.clientX - rect.left - PAD.left) / plotW) * windowMs
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

  const summary = last ? `${title}, now ${format(last.v)}` : `${title}, no data yet`

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          ref={box}
          className="relative rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          tabIndex={0}
          role="img"
          aria-label={summary}
          onKeyDown={onKeyDown}
          onBlur={() => setActive(null)}
        >
          <svg width={width} height={HEIGHT} className="block touch-none" onPointerMove={onPointerMove} onPointerLeave={() => setActive(null)}>
            {yTicks.map((tick) => (
              <g key={tick}>
                <line x1={PAD.left} x2={PAD.left + plotW} y1={y(tick)} y2={y(tick)} className="stroke-border" strokeWidth={1} />
                <text x={PAD.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
                  {format(tick)}
                </text>
              </g>
            ))}
            {[start, start + windowMs / 2, end].map((t, i) => (
              <text
                key={i}
                x={x(t)}
                y={HEIGHT - 6}
                textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}
                className="fill-muted-foreground text-[11px] tabular-nums"
              >
                {last ? formatClock(t) : ''}
              </text>
            ))}

            {area && <path d={area} className="fill-chart-1/10" />}
            {line && <path d={line} fill="none" className="stroke-chart-1" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}

            {last && !hovered && (
              <>
                <circle cx={x(last.t)} cy={y(last.v)} r={4} className="fill-chart-1 stroke-card" strokeWidth={2} />
                <text x={x(last.t) + 10} y={y(last.v)} dy="0.32em" className="fill-foreground text-xs font-semibold">
                  {format(last.v)}
                </text>
              </>
            )}

            {hovered && (
              <>
                <line x1={x(hovered.t)} x2={x(hovered.t)} y1={PAD.top} y2={baseline} className="stroke-muted-foreground/40" strokeWidth={1} />
                <circle cx={x(hovered.t)} cy={y(hovered.v)} r={4} className="fill-chart-1 stroke-card" strokeWidth={2} />
              </>
            )}
          </svg>

          {hovered && (
            <div
              className="pointer-events-none absolute top-0 z-10 rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-sm"
              style={{ left: Math.min(x(hovered.t) + 12, width - 140) }}
            >
              <div className="flex items-center gap-1.5">
                <span className="h-0.5 w-3 rounded-full bg-chart-1" />
                <span className="font-semibold">{format(hovered.v)}</span>
              </div>
              <div className="text-muted-foreground">{formatClock(hovered.t)}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
