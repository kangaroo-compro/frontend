import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Clock, Gauge, Power, Thermometer } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PERMISSIONS } from '@/features/accounts/permissions'
import { useCan } from '@/features/auth/access'
import { ControlCard } from '@/features/dashboard/components/control-card'
import { DeviceOverviewCard } from '@/features/dashboard/components/device-overview-card'
import { EnergyCard } from '@/features/dashboard/components/energy-card'
import { MetricCard } from '@/features/dashboard/components/metric-card'
import { ParameterChartsSection, WINDOW_MS } from '@/features/dashboard/components/parameter-charts-section'
import { downloadCsv, samplesToCsv } from '@/features/dashboard/export-csv'
import type { CompressorSample } from '@/features/dashboard/types'
import { useManagerSocket } from '@/features/live/use-manager-socket'
import { getMachine, listMachines } from '@/features/machines/api'
import { condition } from '@/features/machines/condition'
import type { Machine } from '@/features/machines/types'
import { isFinalAck } from '@/features/telemetry/ack'
import { latestEnergy, latestTelemetry, parseEnergy, parseReadings } from '@/features/telemetry/api'
import type { CommandAck, EnergyRow, TelemetryRow } from '@/features/telemetry/types'
import { errorMessage } from '@/lib/api'
import { formatReading, NO_VALUE } from '@/lib/format'

const MACHINE_REFRESH_MS = 15_000
const SEED_SAMPLES = 180 // 15 minutes at one reading every 5 s
const MAX_LIVE_SAMPLES = 400
const LAST_MACHINE_KEY = 'dashboard.machine'

function readLastMachine(): string | null {
  try {
    return localStorage.getItem(LAST_MACHINE_KEY)
  } catch {
    return null // storage blocked: nothing remembered
  }
}

function rememberMachine(id: string) {
  try {
    localStorage.setItem(LAST_MACHINE_KEY, id)
  } catch {
    // storage blocked: the choice is just not remembered
  }
}

/** `<device_id>_<yyyyMMdd-HHmm>.csv`, stamped with the time of the click. */
function exportFilename(deviceId: string): string {
  return `${deviceId}_${format(new Date(), 'yyyyMMdd-HHmm')}.csv`
}

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

/** One machine at a time. Which one: the URL, else the last one picked in this browser, else the first. */
export function DashboardPage() {
  const { machineId } = useParams()
  const navigate = useNavigate()
  const canRead = useCan(PERMISSIONS.machineRead)
  const canCreate = useCan(PERMISSIONS.machineCreate)
  const [lastPicked] = useState(readLastMachine)

  const machines = useQuery({
    queryKey: ['machines', 'selector'],
    queryFn: () => listMachines(200, 0).then((page) => page.machines),
    enabled: canRead,
  })
  const list = machines.data

  const selectedId = machineId ?? (lastPicked && list?.some((m) => m.id === lastPicked) ? lastPicked : list?.[0]?.id)

  const machine = useQuery({
    queryKey: ['machine', selectedId],
    queryFn: () => getMachine(selectedId ?? ''),
    enabled: canRead && selectedId !== undefined,
    refetchInterval: MACHINE_REFRESH_MS,
  })

  useEffect(() => {
    if (machineId) rememberMachine(machineId)
  }, [machineId])

  function select(id: string) {
    rememberMachine(id)
    navigate(`/dashboard/${id}`)
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dashboard</h1>
      </header>

      {!canRead && <p className="text-sm text-muted-foreground">You don't have access to machine data.</p>}
      {canRead && machines.isPending && <Skeleton className="h-40 w-full" />}
      {canRead && machines.isError && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(machines.error)}</AlertDescription>
        </Alert>
      )}
      {list?.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold tracking-tight">No machines registered yet</CardTitle>
          </CardHeader>
          {canCreate && (
            <CardContent>
              <Button asChild variant="outline">
                <Link to="/manage-machine">Go to Machine</Link>
              </Button>
            </CardContent>
          )}
        </Card>
      )}
      {list && list.length > 0 && machine.isPending && <Skeleton className="h-40 w-full" />}
      {machine.isError && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(machine.error)}</AlertDescription>
        </Alert>
      )}
      {list && list.length > 0 && machine.data && (
        <MachineDashboard key={machine.data.id} machine={machine.data} machines={list} onSelect={select} />
      )}
    </div>
  )
}

type Props = { machine: Machine; machines: Machine[]; onSelect: (machineId: string) => void }

function MachineDashboard({ machine, machines, onSelect }: Props) {
  const queryClient = useQueryClient()

  // Not cached between visits: the live samples below start empty on every visit, so a cached seed would leave a gap.
  const seed = useQuery({
    queryKey: ['telemetry', 'window', machine.device_id],
    queryFn: () => latestTelemetry(machine.device_id, SEED_SAMPLES),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  })
  const energySeed = useQuery({
    queryKey: ['energy', 'latest'],
    queryFn: () => latestEnergy(1),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  })
  const [live, setLive] = useState<CompressorSample[]>([])
  const [acks, setAcks] = useState<Record<string, CommandAck>>({})
  const [liveEnergy, setLiveEnergy] = useState<EnergyRow>()

  useManagerSocket({
    devices: [machine.device_id],
    energy: true,
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
    onEnergy: setLiveEnergy,
    onGateway: () => void queryClient.invalidateQueries({ queryKey: ['machine', machine.id] }),
  })

  const samples = mergeSamples(seed.data, live)
  const last = samples.at(-1)
  const since = statusSince(samples)

  const seededEnergy = energySeed.data?.[0]
  const energyRow =
    liveEnergy && (!seededEnergy || Date.parse(liveEnergy.recorded_at) >= Date.parse(seededEnergy.recorded_at))
      ? liveEnergy
      : seededEnergy

  function exportSamples() {
    downloadCsv(exportFilename(machine.device_id), samplesToCsv(machine, samples))
  }

  return (
    <>
      <DeviceOverviewCard
        machine={machine}
        machines={machines}
        onSelectMachine={onSelect}
        machineStatus={last?.status}
        condition={last ? condition({ temperature: last.temperature, pressure: last.pressure }, machine.thresholds) : null}
        onExport={exportSamples}
        exportDisabled={samples.length === 0}
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

      <EnergyCard
        reading={energyRow ? parseEnergy(energyRow.payload) : undefined}
        updatedAt={energyRow ? Date.parse(energyRow.recorded_at) : undefined}
      />
    </>
  )
}
