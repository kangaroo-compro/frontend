import { LoaderCircle, Wifi, WifiOff, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ConnectionState } from '../hooks/use-system-metrics'

type Tone = 'success' | 'warning' | 'danger'

// Live is green; waiting to connect or to reconnect is amber.
const states: Record<ConnectionState, { label: string; icon: LucideIcon; tone: Tone; spin?: boolean }> = {
  live: { label: 'Live', icon: Wifi, tone: 'success' },
  connecting: { label: 'Connecting', icon: LoaderCircle, tone: 'warning', spin: true },
  reconnecting: { label: 'Reconnecting', icon: WifiOff, tone: 'warning' },
}

export function ConnectionBadge({ state }: { state: ConnectionState }) {
  const { label, icon: Icon, tone, spin } = states[state]
  return (
    <Badge role="status" variant={tone} className="rounded-full px-2.5 font-normal">
      <Icon className={cn(spin && 'animate-spin')} aria-hidden />
      {label}
    </Badge>
  )
}
