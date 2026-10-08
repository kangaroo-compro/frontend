import { OctagonAlert, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { formatBytes } from '@/lib/format'

type MeterProps = {
  label: string
  used: number
  total: number
}

const WARNING_AT = 70
const CRITICAL_AT = 90

const levels = {
  normal: { fill: 'bg-chart-1', track: 'bg-chart-1/20' },
  warning: { fill: 'bg-warning', track: 'bg-warning/20' },
  critical: { fill: 'bg-destructive', track: 'bg-destructive/20' },
}

/** Used-vs-total bar. The fill carries severity; the track is a light step of the same color. */
export function Meter({ label, used, total }: MeterProps) {
  const percent = total > 0 ? Math.min((used / total) * 100, 100) : 0
  const level = percent >= CRITICAL_AT ? 'critical' : percent >= WARNING_AT ? 'warning' : 'normal'

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-semibold">{total > 0 ? `${percent.toFixed(0)}%` : 'n/a'}</span>
        </div>
        <div
          className={cn('h-2 overflow-hidden rounded-full', levels[level].track)}
          role="meter"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percent)}
        >
          <div className={cn('h-full rounded-full transition-[width] duration-500', levels[level].fill)} style={{ width: `${percent}%` }} />
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{total > 0 ? `${formatBytes(used)} of ${formatBytes(total)}` : 'No limit or not reported'}</span>
          {level === 'warning' && (
            <span className="flex items-center gap-1">
              <TriangleAlert className="size-3.5 text-warning" aria-hidden /> High
            </span>
          )}
          {level === 'critical' && (
            <span className="flex items-center gap-1">
              <OctagonAlert className="size-3.5 text-destructive" aria-hidden /> Critical
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
