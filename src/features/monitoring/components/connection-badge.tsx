import { LoaderCircle, Wifi, WifiOff, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ConnectionState } from '../hooks/use-system-metrics'

const states: Record<ConnectionState, { label: string; icon: LucideIcon; className: string }> = {
  live: { label: 'Live', icon: Wifi, className: 'text-success' },
  connecting: { label: 'Connecting', icon: LoaderCircle, className: 'animate-spin text-muted-foreground' },
  reconnecting: { label: 'Reconnecting', icon: WifiOff, className: 'text-warning' },
}

export function ConnectionBadge({ state }: { state: ConnectionState }) {
  const { label, icon: Icon, className } = states[state]
  return (
    <span role="status" className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Icon className={cn('size-4', className)} aria-hidden />
      {label}
    </span>
  )
}
