import { Activity, Thermometer, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CompressorSample } from '../types'
import { ParameterLineChart } from './parameter-line-chart'
import { ParameterStatusChart } from './parameter-status-chart'

interface ParameterChartsSectionProps {
  samples: CompressorSample[]
}

export function ParameterChartsSection({ samples }: ParameterChartsSectionProps) {
  const latest = samples[samples.length - 1] ?? {
    t: 0,
    temperature: 68.0,
    voltage: 381,
    ampere: 24.5,
    status: 'ON' as const,
  }

  const tempPoints = samples.map((s) => ({ t: s.t, v: s.temperature }))
  const voltPoints = samples.map((s) => ({ t: s.t, v: s.voltage }))
  const ampPoints = samples.map((s) => ({ t: s.t, v: s.ampere }))
  const statusPoints = samples.map((s) => ({ t: s.t, status: s.status }))

  return (
    <Card className="rounded-xl border bg-card shadow-xs w-full">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-lg font-bold tracking-tight text-foreground">
          Parameter Charts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Temperature Chart */}
          <ParameterLineChart
            icon={<Thermometer className="size-4" />}
            title="Temperature"
            unit="°C"
            latestValue={`${latest.temperature} °C`}
            points={tempPoints}
            yMin={50}
            yMax={80}
          />

          {/* Voltage Chart */}
          <ParameterLineChart
            icon={<Zap className="size-4" />}
            title="Voltage"
            unit="V"
            latestValue={`${latest.voltage} V`}
            points={voltPoints}
            yMin={360}
            yMax={400}
          />

          {/* Ampere Chart */}
          <ParameterLineChart
            icon={<Activity className="size-4" />}
            title="Ampere"
            unit="A"
            latestValue={`${latest.ampere} A`}
            points={ampPoints}
            yMin={20}
            yMax={30}
          />

          {/* Machine Status Chart */}
          <ParameterStatusChart
            latestStatus={latest.status}
            points={statusPoints}
          />
        </div>
      </CardContent>
    </Card>
  )
}
