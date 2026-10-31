import type { ReactNode } from 'react'
import { Check, MoreHorizontal } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface MetricCardProps {
  icon: ReactNode
  label: string
  value: string
  statusBadge?: string
  subtext?: string
  showMore?: boolean
}

export function MetricCard({
  icon,
  label,
  value,
  statusBadge,
  subtext,
  showMore = false,
}: MetricCardProps) {
  return (
    <Card className="rounded-xl border bg-card shadow-xs">
      <CardContent className="flex flex-col justify-between p-5 h-full space-y-4">
        {/* Top Header: Icon + Label, optional More button */}
        <div className="flex items-center justify-between text-muted-foreground">
          <div className="flex items-center gap-2 text-sm font-medium">
            {icon}
            <span>{label}</span>
          </div>
          {showMore && (
            <button
              type="button"
              className="text-muted-foreground/70 hover:text-foreground transition-colors"
              aria-label="More options"
            >
              <MoreHorizontal className="size-4" />
            </button>
          )}
        </div>

        {/* Large Metric Display */}
        <div>
          <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {value}
          </div>
        </div>

        {/* Bottom Detail: Badge or Subtext */}
        <div className="min-h-5 flex items-center">
          {statusBadge && (
            <Badge
              variant="outline"
              className="w-fit gap-1 rounded-full px-2.5 py-0.5 text-xs font-normal text-muted-foreground border-border"
            >
              <Check className="size-3 stroke-[2.2]" aria-hidden />
              {statusBadge}
            </Badge>
          )}

          {subtext && (
            <span className="text-xs text-muted-foreground">{subtext}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
