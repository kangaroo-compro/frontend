import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Clock, Gauge, Power, Thermometer } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { PERMISSIONS } from '@/features/accounts/permissions'
import { useCan } from '@/features/auth/access'
import { ControlCard } from '@/features/dashboard/components/control-card'
import { DeviceOverviewCard } from '@/features/dashboard/components/device-overview-card'
import { MetricCard } from '@/features/dashboard/components/metric-card'
import { ParameterChartsSection, WINDOW_MS } from '@/features/dashboard/components/parameter-charts-section'
import type { CompressorSample } from '@/features/dashboard/types'
import { useManagerSocket } from '@/features/live/use-manager-socket'
import { getMachine, listMachines } from '@/features/machines/api'
import { condition } from '@/features/machines/condition'
import type { Machine } from '@/features/machines/types'
import { isFinalAck } from '@/features/telemetry/ack'
import { latestTelemetry, parseReadings } from '@/features/telemetry/api'
import type { CommandAck, TelemetryRow } from '@/features/telemetry/types'
import { errorMessage } from '@/lib/api'
import { formatReading, NO_VALUE } from '@/lib/format'

const MACHINE_REFRESH_MS = 15_000
const SEED_SAMPLES = 180 // 15 minutes at one reading every 5 s
const MAX_LIVE_SAMPLES = 400

function toSample(row: TelemetryRow): CompressorSample {
  const r = parseReadings(row.payload)
  return {
    t: Date.parse(row.recorded_at),
    temperature: r.temperature,
    pressure: r.pressure,
    runningHours: r.runningHours,
    status: r.status,
  }
}

/** Seed (newest first) and live samples as one oldest-first series of the last 15 minutes. */
function mergeSamples(seed: TelemetryRow[] | undefined, live: CompressorSample[]): CompressorSample[] {
  const byTime = new Map<number, CompressorSample>()
  for (const row of seed ?? []) byTime.set(Date.parse(row.recorded_at), toSample(row))
  for (const s of live) byTime.set(s.t, s)
  const all = [...byTime.values()].filter((s) => Number.isFinite(s.t)).sort((a, b) => a.t - b.t)
  const end = all.at(-1)?.t
  return end === undefined ? [] : all.filter((s) => s.t >= end - WINDOW_MS)
}

/** When the current run of the same status began, as far as the window shows. */
function statusSince(samples: CompressorSample[]): number | undefined {
  const withStatus = samples.filter((s) => s.status !== undefined)
  const last = withStatus.at(-1)
  if (!last) return undefined
  let i = withStatus.length - 1
  while (i > 0 && withStatus[i - 1]?.status === last.status) i--
  return withStatus[i]?.t
}

export function MachineDetailPage() {
  const { machineId = '' } = useParams()
  const navigate = useNavigate()
  const canRead = useCan(PERMISSIONS.machineRead)

  const machine = useQuery({
    queryKey: ['machine', machineId],
    queryFn: () => getMachine(machineId),
    enabled: canRead,
    refetchInterval: MACHINE_REFRESH_MS,
  })
  const machines = useQuery({
    queryKey: ['machines', 'selector'],
    queryFn: () => listMachines(200, 0).then((page) => page.machines),
    enabled: canRead,
  })

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dashboard</h1>
        <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> All machines
        </Link>
      </header>

      {!canRead && <p className="text-sm text-muted-foreground">You don't have access to machine data.</p>}
      {canRead && machine.isPending && <Skeleton className="h-40 w-full" />}
      {canRead && machine.isError && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(machine.error)}</AlertDescription>
        </Alert>
      )}
      {machine.data && (
        <MachineDetail
          key={machine.data.id}
          machine={machine.data}
          machines={machines.data ?? []}
          onSelect={(id) => navigate(`/dashboard/${id}`)}
        />
      )}
    </div>
  )
}

type DetailProps = { machine: Machine; machines: Machine[]; onSelect: (machineId: string) => void }

function MachineDetail({ machine, machines, onSelect }: DetailProps) {
  const queryClient = useQueryClient()

  // Not cached between visits: the live samples below start empty on every visit, so a cached seed would leave a gap.
  const seed = useQuery({
    queryKey: ['telemetry', 'window', machine.device_id],
    queryFn: () => latestTelemetry(machine.device_id, SEED_SAMPLES),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  })
  const [live, setLive] = useState<CompressorSample[]>([])
  const [acks, setAcks] = useState<Record<string, CommandAck>>({})

  useManagerSocket({
    devices: [machine.device_id],
    onTelemetry: (row) => {
      if (row.device_id !== machine.device_id) return
      const sample = toSample(row)
      if (Number.isFinite(sample.t)) setLive((prev) => [...prev, sample].slice(-MAX_LIVE_SAMPLES))
    },
    onAck: (ack) =>
      setAcks((prev) => {
        const known = prev[ack.cmd_id]
        // A late ACCEPTED must not hide a result that already arrived.
        return isFinalAck(known) && !isFinalAck(ack) ? prev : { ...prev, [ack.cmd_id]: ack }
      }),
    onGateway: () => void queryClient.invalidateQueries({ queryKey: ['machine', machine.id] }),
  })

  const samples = mergeSamples(seed.data, live)
  const last = samples.at(-1)
  const since = statusSince(samples)
  const forSelector = machines.length > 0 ? machines : [machine]

  return (
    <>
      <DeviceOverviewCard
        machine={machine}
        machines={forSelector}
        onSelectMachine={onSelect}
        machineStatus={last?.status}
        condition={last ? condition({ temperature: last.temperature, pressure: last.pressure }, machine.thresholds) : null}
      />

      <section aria-label="Machine metrics and control" className="grid grid-cols-1 gap-4 lg:grid-cols-3 w-full">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
          <MetricCard
            icon={<Thermometer className="size-4" />}
            label="Temperature"
            value={formatReading(last?.temperature, '°C')}
            condition={last ? condition({ temperature: last.temperature }, machine.thresholds) : null}
          />
          <MetricCard
            icon={<Power className="size-4" />}
            label="Machine status"
            value={last?.status ?? NO_VALUE}
            subtext={since === undefined ? undefined : `Since ${new Date(since).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`}
          />
          <MetricCard
            icon={<Gauge className="size-4" />}
            label="Pressure"
            value={formatReading(last?.pressure, 'mbar')}
            condition={last ? condition({ pressure: last.pressure }, machine.thresholds) : null}
          />
          <MetricCard
            icon={<Clock className="size-4" />}
            label="Running hours"
            value={formatReading(last?.runningHours, 'h', 0)}
          />
        </div>

        <div className="lg:col-span-1">
          <ControlCard machine={machine} status={last?.status} acks={acks} />
        </div>
      </section>

      <section aria-label="Parameter Charts" className="w-full">
        <ParameterChartsSection samples={samples} thresholds={machine.thresholds} />
      </section>
    </>
  )
}
