import { useState } from 'react'
import { CircleCheck, CircleX, LoaderCircle, LogOut, Table2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { signOutEverywhere } from '@/features/auth/session'
import { ConnectionBadge } from '@/features/monitoring/components/connection-badge'
import { LineChart } from '@/features/monitoring/components/line-chart'
import { Meter } from '@/features/monitoring/components/meter'
import { MetricsTable } from '@/features/monitoring/components/metrics-table'
import { StatTile } from '@/features/monitoring/components/stat-tile'
import { MAX_SAMPLES, SAMPLE_INTERVAL_MS, useSystemMetrics } from '@/features/monitoring/hooks/use-system-metrics'
import type { Sample } from '@/features/monitoring/types'
import { formatBytes, formatDuration, formatPercent, formatRate } from '@/lib/format'

const WINDOW_MS = MAX_SAMPLES * SAMPLE_INTERVAL_MS
const WINDOW_LABEL = `last ${WINDOW_MS / 60_000} minutes`

export function MonitoringPage() {
  const { state, samples } = useSystemMetrics()
  const latest = samples.at(-1)

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Monitoring</h1>
          <p className="text-sm text-muted-foreground">VPS and Manager, live over WebSocket every 2 seconds</p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionBadge state={state} />
          <Button variant="outline" size="sm" onClick={signOutEverywhere}>
            <LogOut aria-hidden /> Sign out
          </Button>
        </div>
      </header>

      {latest ? (
        <Metrics latest={latest} samples={samples} />
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" aria-hidden /> Waiting for the first sample…
          </CardContent>
        </Card>
      )}
    </main>
  )
}

function Metrics({ latest, samples }: { latest: Sample; samples: Sample[] }) {
  const [showTable, setShowTable] = useState(false)
  const { host, manager } = latest.snapshot
  const latencyMs = Math.max(latest.receivedAt - latest.sampledAt, 0)

  return (
    <>
      <section aria-label="Current values" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="CPU" value={formatPercent(host.cpu_percent)} detail={`${host.cpu_cores} cores`} />
        <StatTile label="Load average" value={host.load[0].toFixed(2)} detail={`5 min ${host.load[1].toFixed(2)} · 15 min ${host.load[2].toFixed(2)}`} />
        <StatTile label="Update latency" value={`${latencyMs} ms`} detail="Manager sample → browser (clock skew included)" />
        <StatTile
          label="MQTT broker"
          value={<BrokerStatus connected={manager.mqtt_connected} />}
          detail={`${manager.telemetry_buffered} telemetry rows waiting to flush`}
        />
        <StatTile label="Network in" value={formatRate(manager.net_rx_bytes_per_sec)} detail={`Out ${formatRate(manager.net_tx_bytes_per_sec)}`} />
        <StatTile label="Dashboard connections" value={manager.ws_clients} detail="Authenticated WebSockets" />
        <StatTile label="VPS uptime" value={formatDuration(host.uptime_seconds)} detail={`Manager up ${formatDuration(manager.uptime_seconds)}`} />
        <StatTile label="Go runtime" value={formatBytes(manager.heap_bytes)} detail={`Heap · ${manager.goroutines} goroutines`} />
      </section>

      <section aria-label="History" className="grid gap-3 lg:grid-cols-2">
        <LineChart
          title="CPU usage"
          description={`All cores, ${WINDOW_LABEL}`}
          points={samples.map((s) => ({ t: s.sampledAt, v: s.snapshot.host.cpu_percent }))}
          windowMs={WINDOW_MS}
          yMax={100}
          yTicks={[0, 50, 100]}
          format={(v) => `${Math.round(v)}%`}
        />
        <LineChart
          title="Memory used"
          description={`Of ${formatBytes(host.memory_total_bytes)} RAM, ${WINDOW_LABEL}`}
          points={samples.map((s) => ({ t: s.sampledAt, v: s.snapshot.host.memory_used_bytes }))}
          windowMs={WINDOW_MS}
          yMax={host.memory_total_bytes}
          yTicks={[0, host.memory_total_bytes / 2, host.memory_total_bytes]}
          format={formatBytes}
        />
      </section>

      <section aria-label="Capacity" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Meter label="VPS memory" used={host.memory_used_bytes} total={host.memory_total_bytes} />
        <Meter label="Swap" used={host.swap_used_bytes} total={host.swap_total_bytes} />
        <Meter label="Disk (/)" used={host.disk_used_bytes} total={host.disk_total_bytes} />
        <Meter label="Manager container memory" used={manager.memory_bytes} total={manager.memory_limit_bytes} />
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <Button variant="outline" size="sm" onClick={() => setShowTable((v) => !v)} aria-expanded={showTable}>
            <Table2 aria-hidden /> {showTable ? 'Hide data table' : 'Show data table'}
          </Button>
        </div>
        {showTable && <MetricsTable samples={samples} />}
      </section>
    </>
  )
}

function BrokerStatus({ connected }: { connected: boolean }) {
  return connected ? (
    <span className="flex items-center gap-2">
      <CircleCheck className="size-5 text-success" aria-hidden /> Connected
    </span>
  ) : (
    <span className="flex items-center gap-2">
      <CircleX className="size-5 text-destructive" aria-hidden /> Disconnected
    </span>
  )
}
