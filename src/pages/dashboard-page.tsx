import { useState } from 'react'
import { Activity, Power, Thermometer, Zap } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DeviceOverviewCard } from '@/features/dashboard/components/device-overview-card'
import { MetricCard } from '@/features/dashboard/components/metric-card'
import { ControlCard } from '@/features/dashboard/components/control-card'
import { ParameterChartsSection } from '@/features/dashboard/components/parameter-charts-section'
import { useCompressorTelemetry } from '@/features/dashboard/hooks/use-compressor-telemetry'

export function DashboardPage() {
  const [selectedDevice, setSelectedDevice] = useState('compressor-1')
  const { state, samples, latest } = useCompressorTelemetry(selectedDevice)

  const temperatureDisplay = latest ? `${latest.temperature}°C` : '68°C'
  const machineStatusDisplay = latest ? latest.status : 'ON'
  const voltageDisplay = latest ? `${latest.voltage} V` : '381 V'
  const ampereDisplay = latest ? `${latest.ampere} A` : '24.5 A'

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Top Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Dashboard
          </h1>
        </div>

        {/* Technician Profile Pill */}
        <div className="flex items-center gap-3 rounded-full border bg-muted/40 py-1.5 pl-2 pr-4 shadow-2xs">
          <Avatar className="size-8 border bg-muted">
            <AvatarFallback className="bg-muted-foreground/20 text-xs font-semibold text-foreground">
              JD
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col text-left leading-tight">
            <span className="text-[11px] text-muted-foreground">Technicians :</span>
            <span className="text-xs font-semibold text-foreground">John Doe</span>
          </div>
        </div>
      </header>

      {/* Device Overview Card */}
      <section aria-label="Device summary" className="w-full">
        <DeviceOverviewCard
          selectedDevice={selectedDevice}
          onSelectDevice={setSelectedDevice}
          connectionState={state}
          machineStatus={latest?.status ?? 'ON'}
        />
      </section>

      {/* Middle Row: 2x2 Metric Tiles + ON/OFF Control */}
      <section aria-label="Machine metrics and control" className="grid grid-cols-1 gap-4 lg:grid-cols-3 w-full">
        {/* Left: 2x2 Metric Tiles */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
          <MetricCard
            icon={<Thermometer className="size-4" />}
            label="Temperature"
            value={temperatureDisplay}
            statusBadge="Normal"
            showMore
          />
          <MetricCard
            icon={<Power className="size-4" />}
            label="Machine status"
            value={machineStatusDisplay}
            subtext="Since 08:02 AM"
          />
          <MetricCard
            icon={<Zap className="size-4" />}
            label="Volt"
            value={voltageDisplay}
            statusBadge="Normal"
            showMore
          />
          <MetricCard
            icon={<Activity className="size-4" />}
            label="Ampere"
            value={ampereDisplay}
            statusBadge="Normal"
          />
        </div>

        {/* Right: ON/OFF Control */}
        <div className="lg:col-span-1">
          <ControlCard status={latest?.status ?? 'ON'} />
        </div>
      </section>

      {/* Bottom Section: Parameter Charts (Full width, interactive SVG with WebSocket live stream) */}
      <section aria-label="Parameter Charts" className="w-full">
        <ParameterChartsSection samples={samples} />
      </section>
    </div>
  )
}
