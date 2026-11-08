import { Card, CardContent } from '@/components/ui/card'
import { NO_VALUE } from '@/lib/format'

type Props = {
  total?: number
  normal?: number
  abnormal?: number
  disconnected?: number
}

/** The four counters above the machine list; a counter that cannot be known yet shows —. */
export function OverviewStats({ total, normal, abnormal, disconnected }: Props) {
  const tiles = [
    { label: 'Machine total', value: total },
    { label: 'Normal Conditions', value: normal },
    { label: 'Abnormal Conditions', value: abnormal },
    { label: 'Disconnected Devices', value: disconnected },
  ]
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((tile) => (
        <Card key={tile.label} className="rounded-xl border bg-card shadow-xs">
          <CardContent className="flex h-full flex-col justify-between gap-6 p-5">
            <span className="text-sm text-muted-foreground">{tile.label}</span>
            <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {tile.value ?? NO_VALUE}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
