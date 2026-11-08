import { Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { EnergyReadings } from '@/features/telemetry/types'
import { formatClock, formatReading } from '@/lib/format'

type Props = {
  reading?: EnergyReadings
  /** epoch ms the Manager received the reading */
  updatedAt?: number
}

/** The panel power meter. One meter serves all machines, so this is not per machine. */
export function EnergyCard({ reading, updatedAt }: Props) {
  const items = [
    { label: 'Voltage', value: formatReading(reading?.voltage, 'V') },
    { label: 'Current', value: formatReading(reading?.current, 'A') },
    { label: 'Power', value: formatReading(reading?.power, 'kW') },
    { label: 'Energy', value: formatReading(reading?.energy, 'kWh') },
    { label: 'Power factor', value: formatReading(reading?.powerFactor, '', 2) },
    { label: 'Frequency', value: formatReading(reading?.frequency, 'Hz') },
  ]
  return (
    <Card className="rounded-xl border bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
          <Zap className="size-4 text-muted-foreground" aria-hidden />
          Panel Energy
        </CardTitle>
        <span className="text-xs text-muted-foreground tabular-nums">
          {updatedAt === undefined ? 'No data yet' : `updated ${formatClock(updatedAt)}`}
        </span>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 p-5 pt-0 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className="text-xl font-semibold tabular-nums text-foreground">{item.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
