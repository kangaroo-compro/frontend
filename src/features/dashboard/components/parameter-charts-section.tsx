import { Gauge, Thermometer } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { Thresholds } from '@/features/machines/types'
import { formatReading } from '@/lib/format'
import type { CompressorSample } from '../types'
import { yRange } from '../y-range'
import { ParameterLineChart } from './parameter-line-chart'
import { ParameterStatusChart } from './parameter-status-chart'

export const WINDOW_MS = 15 * 60 * 1000

interface ParameterChartsSectionProps {
  samples: CompressorSample[]
  thresholds: Thresholds
}

/** Temperature, pressure and status of the last 15 minutes. Samples without a value are left out of that chart. */
export function ParameterChartsSection({ samples, thresholds }: ParameterChartsSectionProps) {
  const last = samples.at(-1)

  const tempPoints = samples.flatMap((s) => (s.temperature === undefined ? [] : [{ t: s.t, v: s.temperature }]))
  const pressurePoints = samples.flatMap((s) => (s.pressure === undefined ? [] : [{ t: s.t, v: s.pressure }]))
  const statusPoints = samples.flatMap((s) => (s.status === undefined ? [] : [{ t: s.t, status: s.status }]))
  const limit = (max: number) => (max === 0 ? undefined : max) // 0/0 means the band is not set

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold tracking-tight text-foreground">Parameter Charts</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <ParameterLineChart
              icon={<Thermometer className="size-4" />}
              title="Temperature"
              unit="°C"
              latestValue={formatReading(last?.temperature, '°C')}
              points={tempPoints}
              windowMs={WINDOW_MS}
              limit={limit(thresholds.temperature.max)}
              {...yRange(
                tempPoints.map((p) => p.v),
                thresholds.temperature,
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <ParameterLineChart
              icon={<Gauge className="size-4" />}
              title="Pressure"
              unit="mbar"
              latestValue={formatReading(last?.pressure, 'mbar')}
              points={pressurePoints}
              windowMs={WINDOW_MS}
              limit={limit(thresholds.pressure.max)}
              {...yRange(
                pressurePoints.map((p) => p.v),
                thresholds.pressure,
              )}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent>
            <ParameterStatusChart latestStatus={statusPoints.at(-1)?.status} points={statusPoints} windowMs={WINDOW_MS} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
