import type { ReactNode } from 'react'
import { Check, TriangleAlert } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Condition } from '@/features/machines/condition'
import { NO_VALUE } from '@/lib/format'

interface MetricCardProps {
  icon: ReactNode
  label: string
  value: string
  /** Shows a condition badge: undefined leaves it out, null shows —, because no reading exists. */
  condition?: Condition | null
  subtext?: string
}

export function MetricCard({ icon, label, value, condition, subtext }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="flex h-full flex-col justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>

        <div className="text-3xl font-bold tracking-tight text-foreground tabular-nums sm:text-4xl">{value}</div>

        <div className="min-h-5 flex items-center">
          {condition === null && <span className="text-xs text-muted-foreground">{NO_VALUE}</span>}
          {condition && (
            <Badge
              variant={condition === 'Abnormal' ? 'destructive' : 'outline'}
              className="w-fit gap-1 rounded-full px-2.5 py-0.5 text-xs font-normal"
            >
              {condition === 'Abnormal' ? <TriangleAlert aria-hidden /> : <Check aria-hidden />}
              {condition}
            </Badge>
          )}
          {subtext && <span className="text-xs text-muted-foreground">{subtext}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
