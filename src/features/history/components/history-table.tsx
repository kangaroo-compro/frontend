import { format } from 'date-fns'
import { DataTable, type Column } from '@/components/data-table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { condition } from '@/features/machines/condition'
import { ConditionBadge, MachineStatusBadge } from '@/features/machines/components/status-badges'
import type { Machine, PageMeta } from '@/features/machines/types'
import { parseReadings } from '@/features/telemetry/api'
import type { TelemetryRow } from '@/features/telemetry/types'
import { formatReading } from '@/lib/format'
import type { Params } from './history-filters'

type Props = {
  machine: Machine
  params: Params
  rows?: TelemetryRow[]
  meta?: PageMeta
  page: number
  onPageChange: (page: number) => void
  pageSize: number
  onPageSizeChange: (size: number) => void
  loading: boolean
  error?: string
}

export function HistoryTable({ machine, params, rows, meta, page, onPageChange, pageSize, onPageSizeChange, loading, error }: Props) {
  const columns: Column<TelemetryRow>[] = [
    { key: 'time', header: 'Time', cell: (r) => format(new Date(r.recorded_at), 'dd/MM/yyyy HH:mm:ss') },
    { key: 'machine', header: 'Machine', cell: () => machine.name },
    ...(params.status
      ? [{ key: 'status', header: 'Status', cell: (r: TelemetryRow) => <MachineStatusBadge status={parseReadings(r.payload).status} /> }]
      : []),
    ...(params.temperature
      ? [{ key: 'temp', header: 'Temp', cell: (r: TelemetryRow) => formatReading(parseReadings(r.payload).temperature, '°C') }]
      : []),
    ...(params.pressure
      ? [{ key: 'pressure', header: 'Pressure', cell: (r: TelemetryRow) => formatReading(parseReadings(r.payload).pressure, 'mbar') }]
      : []),
    ...(params.runningHours
      ? [{ key: 'hours', header: 'Running hours', cell: (r: TelemetryRow) => formatReading(parseReadings(r.payload).runningHours, 'h', 0) }]
      : []),
    {
      key: 'condition',
      header: 'Condition',
      cell: (r) => <ConditionBadge value={condition(parseReadings(r.payload), machine.thresholds)} />,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold tracking-tight">Data Table</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !rows && <Skeleton className="h-40 w-full" />}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {rows && (
          <DataTable
            data={rows}
            columns={columns}
            rowKey={(r) => `${r.device_id}-${r.recorded_at}`}
            empty="No readings in this range."
            meta={meta}
            page={page}
            onPageChange={onPageChange}
            pageSize={pageSize}
            onPageSizeChange={onPageSizeChange}
          />
        )}
      </CardContent>
    </Card>
  )
}
