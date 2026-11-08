import { Badge } from '@/components/ui/badge'
import { NO_VALUE } from '@/lib/format'
import type { MachineStatus } from '@/features/telemetry/types'
import type { Condition } from '../condition'
import type { Machine } from '../types'

const pill = 'rounded-full px-2.5 font-normal'

/** A dot in the badge's own text color, so it always matches. */
function Dot() {
  return <span aria-hidden className="size-1.5 rounded-full bg-current" />
}

/** Normal is green, Abnormal red; — (no reading to judge) is plain text. */
export function ConditionBadge({ value }: { value: Condition | null }) {
  if (value === null) return <span className="text-muted-foreground">{NO_VALUE}</span>
  return (
    <Badge variant={value === 'Abnormal' ? 'danger' : 'success'} className={pill}>
      {value}
    </Badge>
  )
}

/** Connected is green, Disconnected red. */
export function ConnectivityBadge({ status }: { status: Machine['status'] }) {
  const connected = status === 'connected'
  return (
    <Badge variant={connected ? 'success' : 'danger'} className={pill}>
      <Dot />
      {connected ? 'Connected' : 'Disconnected'}
    </Badge>
  )
}

/** ON is green, OFF neutral; — when no status has arrived. */
export function MachineStatusBadge({ status }: { status?: MachineStatus }) {
  if (status === undefined) return <span className="text-muted-foreground">{NO_VALUE}</span>
  return (
    <Badge variant={status === 'ON' ? 'success' : 'secondary'} className={pill}>
      {status}
    </Badge>
  )
}

/** Enabled is green, Disabled neutral. */
export function ControlBadge({ enabled }: { enabled: boolean }) {
  return (
    <Badge variant={enabled ? 'success' : 'secondary'} className={pill}>
      {enabled ? 'Enabled' : 'Disabled'}
    </Badge>
  )
}
