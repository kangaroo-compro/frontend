import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { formatClock } from './format'

export type Point = { t: number; v: number }

type LineChartProps = {
  title: string
  subtitle: string
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
export function LineChart({ title, subtitle, points, windowMs, yMax, yTicks, format }: LineChartProps) {
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

  const summary = last ? `${title}, last ${windowMs / 60_000} minutes, now ${format(last.v)}` : `${title}, no data yet`

  return (
    <figure className="viz-card flex flex-col gap-3 p-4">
      <figcaption>
        <div className="text-sm font-medium" style={{ color: 'var(--viz-ink)' }}>
          {title}
        </div>
        <div className="text-xs" style={{ color: 'var(--viz-ink-secondary)' }}>
          {subtitle}
        </div>
      </figcaption>

      <div
        ref={box}
        className="relative outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        tabIndex={0}
        role="img"
        aria-label={summary}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
      >
        <svg
          width={width}
          height={HEIGHT}
          className="block touch-none"
          onPointerMove={onPointerMove}
          onPointerLeave={() => setActive(null)}
        >
          {yTicks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={PAD.left + plotW} y1={y(tick)} y2={y(tick)} stroke={tick === 0 ? 'var(--viz-axis)' : 'var(--viz-grid)'} strokeWidth={1} />
              <text x={PAD.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--viz-ink-muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {format(tick)}
              </text>
            </g>
          ))}
          {[start, start + windowMs / 2, end].map((t, i) => (
            <text key={i} x={x(t)} y={HEIGHT - 6} textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'} fontSize={11} fill="var(--viz-ink-muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatClock(t)}
            </text>
          ))}

          {area && <path d={area} fill="var(--viz-series)" fillOpacity={0.1} />}
          {line && <path d={line} fill="none" stroke="var(--viz-series)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}

          {last && !hovered && (
            <>
              <circle cx={x(last.t)} cy={y(last.v)} r={4} fill="var(--viz-series)" stroke="var(--viz-surface)" strokeWidth={2} />
              <text x={x(last.t) + 10} y={y(last.v)} dy="0.32em" fontSize={12} fontWeight={600} fill="var(--viz-ink)">
                {format(last.v)}
              </text>
            </>
          )}

          {hovered && (
            <>
              <line x1={x(hovered.t)} x2={x(hovered.t)} y1={PAD.top} y2={baseline} stroke="var(--viz-axis)" strokeWidth={1} />
              <circle cx={x(hovered.t)} cy={y(hovered.v)} r={4} fill="var(--viz-series)" stroke="var(--viz-surface)" strokeWidth={2} />
            </>
          )}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute top-0 z-10 rounded-md px-2.5 py-1.5 text-xs shadow-sm"
            style={{
              left: Math.min(x(hovered.t) + 12, width - 140),
              background: 'var(--viz-surface)',
              border: '1px solid var(--viz-border)',
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-3 rounded-full" style={{ background: 'var(--viz-series)' }} />
              <span className="font-semibold" style={{ color: 'var(--viz-ink)' }}>
                {format(hovered.v)}
              </span>
            </div>
            <div style={{ color: 'var(--viz-ink-secondary)' }}>{formatClock(hovered.t)}</div>
          </div>
        )}
      </div>
    </figure>
  )
}
