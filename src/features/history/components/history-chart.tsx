import { useState } from 'react'
import { format } from 'date-fns'
import { Gauge, Thermometer } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ParameterLineChart } from '@/features/dashboard/components/parameter-line-chart'
import { ParameterStatusChart } from '@/features/dashboard/components/parameter-status-chart'
import { yRange } from '@/features/dashboard/y-range'
import type { Machine } from '@/features/machines/types'
import type { SeriesPoint } from '@/features/telemetry/types'
import { formatReading } from '@/lib/format'
import type { Params } from './history-filters'

type Tab = 'temperature' | 'pressure' | 'status'

type Props = {
  machine: Machine
  from: Date
  to: Date
  params: Params
  points?: SeriesPoint[]
  loading: boolean
  error?: string
}

/** Chart of the stored series: Temperature, Pressure and Status tabs, limited to the ticked parameters. */
export function HistoryChart({ machine, from, to, params, points, loading, error }: Props) {
  const tabs = (
    [
      { key: 'temperature', label: 'Temperature', on: params.temperature },
      { key: 'pressure', label: 'Pressure', on: params.pressure },
      { key: 'status', label: 'Status', on: params.status },
    ] as const
  ).filter((t) => t.on)
  const [chosen, setChosen] = useState<Tab>('temperature')
  const tab = tabs.find((t) => t.key === chosen)?.key ?? tabs[0]?.key

  const t = (p: SeriesPoint) => Date.parse(p.t)
  const temperature = (points ?? []).flatMap((p) => (p.temperature === null ? [] : [{ t: t(p), v: p.temperature }]))
  const pressure = (points ?? []).flatMap((p) => (p.pressure === null ? [] : [{ t: t(p), v: p.pressure }]))
  const status = (points ?? []).flatMap((p) => (p.status === null ? [] : [{ t: t(p), status: p.status }]))
  const windowMs = to.getTime() - from.getTime()
  const limit = (max: number) => (max === 0 ? undefined : max) // 0/0 means the band is not set

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold tracking-tight">
          Chart · {machine.name} · {format(from, 'd MMM HH:mm')} – {format(to, 'd MMM HH:mm')}
        </CardTitle>
        <CardAction className="flex overflow-hidden rounded-lg border" role="group" aria-label="Chart parameter">
          {tabs.map((x) => (
            <Button
              key={x.key}
              type="button"
              variant={x.key === tab ? 'default' : 'ghost'}
              className="rounded-none"
              onClick={() => setChosen(x.key)}
            >
              {x.label}
            </Button>
          ))}
        </CardAction>
      </CardHeader>
      <CardContent>
        {loading && <Skeleton className="h-44 w-full" />}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!tab && <p className="text-sm text-muted-foreground">Tick at least one parameter to see a chart.</p>}
        {!loading && !error && tab === 'temperature' && (
          <ParameterLineChart
            icon={<Thermometer className="size-4" />}
            title="Temperature"
            unit="°C"
            latestValue={formatReading(temperature.at(-1)?.v, '°C')}
            points={temperature}
            windowMs={windowMs}
            endMs={to.getTime()}
            limit={limit(machine.thresholds.temperature.max)}
            {...yRange(
              temperature.map((p) => p.v),
              machine.thresholds.temperature,
            )}
          />
        )}
        {!loading && !error && tab === 'pressure' && (
          <ParameterLineChart
            icon={<Gauge className="size-4" />}
            title="Pressure"
            unit="mbar"
            latestValue={formatReading(pressure.at(-1)?.v, 'mbar')}
            points={pressure}
            windowMs={windowMs}
            endMs={to.getTime()}
            limit={limit(machine.thresholds.pressure.max)}
            {...yRange(
              pressure.map((p) => p.v),
              machine.thresholds.pressure,
            )}
          />
        )}
        {!loading && !error && tab === 'status' && (
          <ParameterStatusChart
            latestStatus={status.at(-1)?.status}
            points={status}
            windowMs={windowMs}
            endMs={to.getTime()}
          />
        )}
      </CardContent>
    </Card>
  )
}
