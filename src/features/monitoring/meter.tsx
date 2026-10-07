import { OctagonAlert, TriangleAlert } from 'lucide-react'
import { formatBytes } from './format'

type MeterProps = {
  label: string
  used: number
  total: number
}

const WARNING_AT = 70
const CRITICAL_AT = 90

/** Used-vs-total bar. The fill carries severity; the track is a light step of the same color. */
export function Meter({ label, used, total }: MeterProps) {
  const percent = total > 0 ? Math.min((used / total) * 100, 100) : 0
  const level = percent >= CRITICAL_AT ? 'critical' : percent >= WARNING_AT ? 'warning' : 'normal'
  const fill = level === 'normal' ? 'var(--viz-series)' : `var(--viz-${level})`

  return (
    <div className="viz-card flex flex-col gap-2 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm" style={{ color: 'var(--viz-ink-secondary)' }}>
          {label}
        </span>
        <span className="text-sm font-semibold" style={{ color: 'var(--viz-ink)' }}>
          {total > 0 ? `${percent.toFixed(0)}%` : 'n/a'}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full"
        style={{ background: `color-mix(in oklch, ${fill} 22%, var(--viz-surface))` }}
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
      >
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${percent}%`, background: fill }} />
      </div>
      <div className="flex items-center justify-between gap-2 text-xs" style={{ color: 'var(--viz-ink-muted)' }}>
        <span>{total > 0 ? `${formatBytes(used)} of ${formatBytes(total)}` : 'No limit or not reported'}</span>
        {level !== 'normal' && (
          <span className="flex items-center gap-1" style={{ color: 'var(--viz-ink-secondary)' }}>
            {level === 'critical' ? (
              <OctagonAlert className="size-3.5" style={{ color: 'var(--viz-critical)' }} aria-hidden />
            ) : (
              <TriangleAlert className="size-3.5" style={{ color: 'var(--viz-warning)' }} aria-hidden />
            )}
            {level === 'critical' ? 'Critical' : 'High'}
          </span>
        )}
      </div>
    </div>
  )
}
