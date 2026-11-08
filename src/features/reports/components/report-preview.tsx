import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { DataTable, type Column } from '@/components/data-table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { condition } from '@/features/machines/condition'
import { ConditionBadge, MachineStatusBadge } from '@/features/machines/components/status-badges'
import type { Machine } from '@/features/machines/types'
import { parseReadings, telemetryRange, telemetrySummary } from '@/features/telemetry/api'
import type { TelemetryRow, TelemetrySummary } from '@/features/telemetry/types'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { errorMessage } from '@/lib/api'
import { formatReading } from '@/lib/format'
import { periodError } from '../period'
import type { ReportType } from '../types'

const DEBOUNCE_MS = 400
const SAMPLE_ROWS = 20
const noop = () => {}

type Props = {
  type: ReportType
  /** Every machine the form can offer; the selection picks from it. */
  machines: Machine[]
  selectedIds: string[]
  from: Date
  to: Date
}

type Preview =
  | { kind: 'summary'; rows: { machine: Machine; summary: TelemetrySummary }[] }
  | { kind: 'readings'; rows: { machine: Machine; row: TelemetryRow }[]; total: number }

const noMachine = (r: { machine: Machine }) => r.machine.id

/** Fetches what the report will contain, from the existing stored-data endpoints. */
async function loadPreview(type: ReportType, machines: Machine[], from: Date, to: Date): Promise<Preview> {
  if (type === 'machine_condition') {
    const rows = await Promise.all(
      machines.map(async (machine) => ({ machine, summary: await telemetrySummary(machine.device_id, from, to) })),
    )
    return { kind: 'summary', rows }
  }
  // Newest rows per machine, merged and cut to the first SAMPLE_ROWS by time.
  const pages = await Promise.all(
    machines.map(async (machine) => ({ machine, page: await telemetryRange(machine.device_id, from, to, SAMPLE_ROWS, 0) })),
  )
  const rows = pages
    .flatMap(({ machine, page }) => page.rows.map((row) => ({ machine, row })))
    .sort((a, b) => Date.parse(b.row.recorded_at) - Date.parse(a.row.recorded_at))
    .slice(0, SAMPLE_ROWS)
  return { kind: 'readings', rows, total: pages.reduce((sum, p) => sum + p.page.meta.total, 0) }
}

const stat = (v: number | null, digits = 1) => formatReading(v, '', digits)

const summaryColumns: Column<{ machine: Machine; summary: TelemetrySummary }>[] = [
  { key: 'machine', header: 'Machine', cell: (r) => r.machine.name },
  { key: 'device', header: 'Device ID', cell: (r) => r.machine.device_id },
  { key: 'readings', header: 'Readings', cell: (r) => r.summary.count },
  { key: 'tmin', header: 'Temperature Min', cell: (r) => stat(r.summary.temperature.min) },
  { key: 'tmax', header: 'Temperature Max', cell: (r) => stat(r.summary.temperature.max) },
  { key: 'tavg', header: 'Temperature Avg', cell: (r) => stat(r.summary.temperature.avg, 2) },
  { key: 'pmin', header: 'Pressure Min', cell: (r) => stat(r.summary.pressure.min) },
  { key: 'pmax', header: 'Pressure Max', cell: (r) => stat(r.summary.pressure.max) },
  { key: 'pavg', header: 'Pressure Avg', cell: (r) => stat(r.summary.pressure.avg, 2) },
]

const readingColumns: Column<{ machine: Machine; row: TelemetryRow }>[] = [
  { key: 'time', header: 'Time', className: 'whitespace-nowrap', cell: (r) => format(new Date(r.row.recorded_at), 'dd/MM/yyyy HH:mm:ss') },
  { key: 'machine', header: 'Machine', cell: (r) => r.machine.name },
  { key: 'device', header: 'Device ID', cell: (r) => r.machine.device_id },
  { key: 'status', header: 'Status', cell: (r) => <MachineStatusBadge status={parseReadings(r.row.payload).status} /> },
  { key: 'temp', header: 'Temperature', cell: (r) => formatReading(parseReadings(r.row.payload).temperature) },
  { key: 'pressure', header: 'Pressure', cell: (r) => formatReading(parseReadings(r.row.payload).pressure) },
  { key: 'hours', header: 'Running hours', cell: (r) => formatReading(parseReadings(r.row.payload).runningHours, '', 0) },
  {
    key: 'condition',
    header: 'Condition',
    cell: (r) => <ConditionBadge value={condition(parseReadings(r.row.payload), r.machine.thresholds)} />,
  },
]

/** Live preview next to the form, refreshed 400 ms after the machines, type or period stop changing. */
export function ReportPreview({ type, machines, selectedIds, from, to }: Props) {
  const wanted = useDebouncedValue(JSON.stringify([type, selectedIds, from.toISOString(), to.toISOString()]), DEBOUNCE_MS)
  const [wantedType, wantedIds, wantedFrom, wantedTo] = JSON.parse(wanted) as [ReportType, string[], string, string]
  const chosen = machines.filter((m) => wantedIds.includes(m.id))
  const problem = periodError(new Date(wantedFrom), new Date(wantedTo))

  const preview = useQuery({
    queryKey: ['report-preview', wanted],
    queryFn: () => loadPreview(wantedType, chosen, new Date(wantedFrom), new Date(wantedTo)),
    enabled: chosen.length > 0 && problem === null,
  })

  const data = preview.data
  const empty = data && (data.kind === 'summary' ? data.rows.every((r) => r.summary.count === 0) : data.rows.length === 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold tracking-tight">Report Preview</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {chosen.length === 0 && <p className="text-sm text-muted-foreground">Select machines to see a preview</p>}
        {chosen.length > 0 && problem && <p className="text-sm text-destructive">{problem}</p>}
        {chosen.length > 0 && !problem && preview.isPending && <Skeleton className="h-40 w-full" />}
        {preview.isError && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage(preview.error)}</AlertDescription>
          </Alert>
        )}
        {empty && <p className="text-sm text-muted-foreground">No data in this period</p>}
        {data && !empty && data.kind === 'summary' && (
          <DataTable data={data.rows} columns={summaryColumns} rowKey={noMachine} empty="" page={1} onPageChange={noop} />
        )}
        {data && !empty && data.kind === 'readings' && (
          <>
            <DataTable
              data={data.rows}
              columns={readingColumns}
              rowKey={(r) => `${r.machine.id}-${r.row.recorded_at}`}
              empty=""
              page={1}
              onPageChange={noop}
            />
            <p className="text-xs text-muted-foreground">
              Showing {data.rows.length} of {data.total} readings
            </p>
          </>
        )}
        <p className="text-xs text-muted-foreground">
          Preview of stored data. Readings from the last 15 minutes may not be included yet.
        </p>
      </CardContent>
    </Card>
  )
}
