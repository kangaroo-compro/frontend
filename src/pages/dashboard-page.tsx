import { useState } from 'react'
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { PERMISSIONS } from '@/features/accounts/permissions'
import { useCan } from '@/features/auth/access'
import { EnergyCard } from '@/features/dashboard/components/energy-card'
import { MachineTable } from '@/features/dashboard/components/machine-table'
import { OverviewStats } from '@/features/dashboard/components/overview-stats'
import type { LatestReading } from '@/features/dashboard/types'
import { useManagerSocket } from '@/features/live/use-manager-socket'
import { condition } from '@/features/machines/condition'
import { listMachines } from '@/features/machines/api'
import { latestEnergy, latestTelemetry, parseEnergy, parseReadings } from '@/features/telemetry/api'
import type { EnergyRow, TelemetryRow } from '@/features/telemetry/types'
import { errorMessage } from '@/lib/api'

const MACHINES_REFRESH_MS = 15_000

function toLatest(row: TelemetryRow): LatestReading {
  return { readings: parseReadings(row.payload), at: Date.parse(row.recorded_at) }
}

export function DashboardPage() {
  const queryClient = useQueryClient()
  const canReadMachines = useCan(PERMISSIONS.machineRead)

  // Connectivity is computed by the Manager (15 s freshness + gateway state): poll, and refetch on a gateway frame.
  const machines = useQuery({
    queryKey: ['machines', 'overview'],
    queryFn: () => listMachines(200, 0).then((page) => page.machines),
    enabled: canReadMachines,
    refetchInterval: MACHINES_REFRESH_MS,
  })
  const list = machines.data

  // Latest reading per machine: seeded once from the newest stored/buffered row, then replaced by live frames.
  const seeds = useQueries({
    queries: (list ?? []).map((m) => ({
      queryKey: ['telemetry', 'latest', m.device_id],
      queryFn: () => latestTelemetry(m.device_id, 1),
      staleTime: Infinity,
    })),
  })
  const [live, setLive] = useState<Record<string, LatestReading>>({})
  const latest: Record<string, LatestReading> = {}
  ;(list ?? []).forEach((m, i) => {
    const row = seeds[i]?.data?.[0]
    const seeded = row ? toLatest(row) : undefined
    const current = live[m.device_id]
    const newest = current && (!seeded || current.at >= seeded.at) ? current : seeded
    if (newest) latest[m.device_id] = newest
  })

  // Panel energy: seeded once, then live.
  const energySeed = useQuery({ queryKey: ['energy', 'latest'], queryFn: () => latestEnergy(1), staleTime: Infinity })
  const [liveEnergy, setLiveEnergy] = useState<EnergyRow>()
  const seededEnergy = energySeed.data?.[0]
  const energyRow =
    liveEnergy && (!seededEnergy || Date.parse(liveEnergy.recorded_at) >= Date.parse(seededEnergy.recorded_at))
      ? liveEnergy
      : seededEnergy

  useManagerSocket({
    devices: '*',
    energy: true,
    onTelemetry: (row) => setLive((prev) => ({ ...prev, [row.device_id]: toLatest(row) })),
    onEnergy: setLiveEnergy,
    onGateway: () => void queryClient.invalidateQueries({ queryKey: ['machines', 'overview'] }),
  })

  const conditions = (list ?? []).map((m) => {
    const reading = latest[m.device_id]
    return reading ? condition(reading.readings, m.thresholds) : null
  })
  const counts = list && {
    normal: conditions.filter((c) => c === 'Normal').length,
    abnormal: conditions.filter((c) => c === 'Abnormal').length,
    disconnected: list.filter((m) => m.status === 'disconnected').length,
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dashboard</h1>
      </header>

      <OverviewStats
        total={list?.length}
        normal={counts?.normal}
        abnormal={counts?.abnormal}
        disconnected={counts?.disconnected}
      />

      <MachineTable
        machines={list}
        latest={latest}
        canRead={canReadMachines}
        loading={machines.isPending && canReadMachines}
        error={machines.isError ? errorMessage(machines.error) : undefined}
      />

      <EnergyCard
        reading={energyRow ? parseEnergy(energyRow.payload) : undefined}
        updatedAt={energyRow ? Date.parse(energyRow.recorded_at) : undefined}
      />
    </div>
  )
}
