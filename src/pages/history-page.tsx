import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { PERMISSIONS } from '@/features/accounts/permissions'
import { useCan } from '@/features/auth/access'
import { HistoryChart } from '@/features/history/components/history-chart'
import { HistoryFilters, type HistoryFilter, type Params } from '@/features/history/components/history-filters'
import { HistoryTable } from '@/features/history/components/history-table'
import { listMachines } from '@/features/machines/api'
import { telemetryRange, telemetrySeries, telemetrySummary } from '@/features/telemetry/api'
import { usePageSize } from '@/hooks/use-page-size'
import { errorMessage } from '@/lib/api'
import { formatReading } from '@/lib/format'

const ALL_PARAMS: Params = { temperature: true, pressure: true, runningHours: true, status: true }
const SERIES_POINTS = 200

export function HistoryPage() {
  const canRead = useCan(PERMISSIONS.history)
  const canReadMachines = useCan(PERMISSIONS.machineRead)

  const machines = useQuery({
    queryKey: ['machines', 'history'],
    queryFn: () => listMachines(200, 0).then((p) => p.machines),
    enabled: canRead && canReadMachines,
  })
  const list = machines.data ?? []
  const first = list[0]

  // The page opens on the first machine and the last 24 hours; later changes apply only with the button.
  const [initial] = useState(() => {
    const to = new Date()
    return { from: new Date(to.getTime() - 24 * 3_600_000), to, params: ALL_PARAMS }
  })
  const [draft, setDraft] = useState<HistoryFilter>({ machineId: '', ...initial })
  const [applied, setApplied] = useState<HistoryFilter | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = usePageSize('history', 20)

  const shownDraft = { ...draft, machineId: draft.machineId || first?.id || '' }
  const active = applied ?? (first ? { machineId: first.id, ...initial } : null)
  const machine = list.find((m) => m.id === active?.machineId)
  const range = active && machine ? { deviceId: machine.device_id, from: active.from, to: active.to } : null
  const key = range && [range.deviceId, range.from.toISOString(), range.to.toISOString()]

  const summary = useQuery({
    queryKey: ['history', 'summary', key],
    queryFn: () => telemetrySummary(range!.deviceId, range!.from, range!.to),
    enabled: range !== null,
  })
  const series = useQuery({
    queryKey: ['history', 'series', key],
    queryFn: () => telemetrySeries(range!.deviceId, range!.from, range!.to, SERIES_POINTS),
    enabled: range !== null,
  })
  const table = useQuery({
    queryKey: ['history', 'table', key, page, pageSize],
    queryFn: () => telemetryRange(range!.deviceId, range!.from, range!.to, pageSize, (page - 1) * pageSize),
    enabled: range !== null,
    placeholderData: keepPreviousData,
  })

  function apply() {
    setApplied(shownDraft)
    setPage(1)
  }

  const stats = summary.data
  const tiles = [
    { label: 'Number of Readings', value: stats ? String(stats.count) : formatReading(undefined) },
    { label: 'Minimum temperature', value: formatReading(stats?.temperature.min, '°C') },
    { label: 'Maximum temperature', value: formatReading(stats?.temperature.max, '°C') },
    { label: 'Average temperature', value: formatReading(stats?.temperature.avg, '°C', 2) },
  ]

  return (
    <div className="flex w-full flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">History</h1>
      </header>

      {!canRead && <p className="text-sm text-muted-foreground">You don't have access to this page.</p>}
      {canRead && !canReadMachines && (
        <p className="text-sm text-muted-foreground">Your role cannot view machines, so no machine can be selected.</p>
      )}
      {canRead && canReadMachines && machines.isError && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(machines.error)}</AlertDescription>
        </Alert>
      )}
      {canRead && machines.isSuccess && list.length === 0 && (
        <p className="text-sm text-muted-foreground">No machines registered yet.</p>
      )}

      {canRead && machines.isSuccess && list.length > 0 && (
        <>
          <HistoryFilters machines={list} value={shownDraft} onChange={setDraft} onApply={apply} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map((tile) => (
              <Card key={tile.label}>
                <CardContent className="flex flex-col gap-3">
                  <span className="text-sm text-muted-foreground">{tile.label}</span>
                  <span className="text-2xl font-bold tabular-nums text-foreground">{tile.value}</span>
                </CardContent>
              </Card>
            ))}
          </div>
          {summary.isError && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(summary.error)}</AlertDescription>
            </Alert>
          )}

          {active && machine && (
            <>
              <HistoryChart
                machine={machine}
                from={active.from}
                to={active.to}
                params={active.params}
                points={series.data}
                loading={series.isPending}
                error={series.isError ? errorMessage(series.error) : undefined}
              />
              <HistoryTable
                machine={machine}
                params={active.params}
                rows={table.data?.rows}
                meta={table.data?.meta}
                page={page}
                onPageChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={(size) => {
                  setPageSize(size)
                  setPage(1)
                }}
                loading={table.isPending}
                error={table.isError ? errorMessage(table.error) : undefined}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
