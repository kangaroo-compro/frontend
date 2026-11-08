import { Badge } from '@/components/ui/badge'
import { NO_VALUE } from '@/lib/format'
import type { Condition } from '../condition'
import type { Machine } from '../types'

/** Normal or Abnormal; — when there is no reading to judge. */
export function ConditionBadge({ value }: { value: Condition | null }) {
  if (value === null) return <span className="text-muted-foreground">{NO_VALUE}</span>
  return (
    <Badge variant={value === 'Abnormal' ? 'destructive' : 'outline'} className="rounded-full px-2.5 font-normal">
      {value}
    </Badge>
  )
}

export function ConnectivityBadge({ status }: { status: Machine['status'] }) {
  return (
    <Badge variant={status === 'connected' ? 'outline' : 'secondary'} className="rounded-full px-2.5 font-normal">
      {status === 'connected' ? 'Connected' : 'Disconnected'}
    </Badge>
  )
}
