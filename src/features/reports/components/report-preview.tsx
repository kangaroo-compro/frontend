import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { DataTable, type Column, type TableMeta } from '@/components/data-table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { condition } from '@/features/machines/condition'
import { ConditionBadge, MachineStatusBadge } from '@/features/machines/components/status-badges'
import type { Machine } from '@/features/machines/types'
import { parseReadings, telemetryRange, telemetrySummary } from '@/features/telemetry/api'
import type { TelemetryRow, TelemetrySummary } from '@/features/telemetry/types'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { usePageSize } from '@/hooks/use-page-size'
import { errorMessage } from '@/lib/api'
import { formatReading } from '@/lib/format'
import { periodError } from '../period'
import type { ReportType } from '../types'

const DEBOUNCE_MS = 400

type Props = {
  type: ReportType
  /** Every machine the form can offer; the selection picks from it. */
  machines: Machine[]
  selectedIds: string[]
  from: Date
  to: Date
}

type Preview =
  | { kind: 'summary'; rows: { machine: Machine; summary: TelemetrySummary }[]; meta: TableMeta }
  | { kind: 'readings'; rows: { machine: Machine; row: TelemetryRow }[]; meta: TableMeta }

const noMachine = (r: { machine: Machine }) => r.machine.id

/** Fetches what the report will contain, from the existing stored-data endpoints. */
async function loadPreview(
  type: ReportType,
  machines: Machine[],
  from: Date,
  to: Date,
  page: number,
  pageSize: number,
): Promise<Preview> {
  const offset = (page - 1) * pageSize

  if (type === 'machine_condition') {
    const all = await Promise.all(
      machines.map(async (machine) => ({ machine, summary: await telemetrySummary(machine.device_id, from, to) })),
    )
    return {
      kind: 'summary',
      rows: all.slice(offset, offset + pageSize),
      meta: { limit: pageSize, offset, total: all.length },
    }
  }

  if (machines.length === 1 && machines[0]) {
    const machine = machines[0]
    const pageResult = await telemetryRange(machine.device_id, from, to, pageSize, offset)
    return {
      kind: 'readings',
      rows: pageResult.rows.map((row) => ({ machine, row })),
      meta: pageResult.meta,
    }
  }

  // Multiple machines: query range for each, sort combined rows newest first, and take page slice
  const pages = await Promise.all(
    machines.map(async (machine) => ({
      machine,
      page: await telemetryRange(machine.device_id, from, to, pageSize, offset),
    })),
  )
  const rows = pages
    .flatMap(({ machine, page: p }) => p.rows.map((row) => ({ machine, row })))
    .sort((a, b) => Date.parse(b.row.recorded_at) - Date.parse(a.row.recorded_at))
    .slice(0, pageSize)
  const total = pages.reduce((sum, p) => sum + p.page.meta.total, 0)
  return {
    kind: 'readings',
    rows,
    meta: { limit: pageSize, offset, total },
  }
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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = usePageSize('report-preview', 10)

  const wanted = useDebouncedValue(
    JSON.stringify([type, selectedIds, from.toISOString(), to.toISOString()]),
    DEBOUNCE_MS,
  )
  const [wantedType, wantedIds, wantedFrom, wantedTo] = JSON.parse(wanted) as [
    ReportType,
    string[],
    string,
    string,
  ]

  const [prevWanted, setPrevWanted] = useState(wanted)
  if (prevWanted !== wanted) {
    setPrevWanted(wanted)
    setPage(1)
  }

  const chosen = machines.filter((m) => wantedIds.includes(m.id))
  const problem = periodError(new Date(wantedFrom), new Date(wantedTo))

  const preview = useQuery({
    queryKey: ['report-preview', wanted, page, pageSize],
    queryFn: () => loadPreview(wantedType, chosen, new Date(wantedFrom), new Date(wantedTo), page, pageSize),
    enabled: chosen.length > 0 && problem === null,
  })

  const data = preview.data
  const empty =
    data &&
    (data.kind === 'summary' ? data.rows.every((r) => r.summary.count === 0) : data.meta.total === 0)

  return (
    <Card className="flex flex-col min-w-0">
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
          <DataTable
            data={data.rows}
            columns={summaryColumns}
            rowKey={noMachine}
            empty=""
            meta={data.meta}
            page={page}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setPage(1)
            }}
            tableWrapperClassName="max-h-[380px] sm:max-h-[440px] overflow-auto rounded-md border"
            stickyHeader
            footerExtra={
              <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-muted-foreground">
                <span>
                  Showing {data.meta.total === 0 ? 0 : data.meta.offset + 1}–
                  {Math.min(data.meta.offset + data.rows.length, data.meta.total)} of {data.meta.total} machines
                </span>
                <span>Preview of stored data. Readings from the last 15 minutes may not be included yet.</span>
              </div>
            }
          />
        )}
        {data && !empty && data.kind === 'readings' && (
          <DataTable
            data={data.rows}
            columns={readingColumns}
            rowKey={(r) => `${r.machine.id}-${r.row.recorded_at}`}
            empty=""
            meta={data.meta}
            page={page}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setPage(1)
            }}
            tableWrapperClassName="max-h-[380px] sm:max-h-[440px] overflow-auto rounded-md border"
            stickyHeader
            footerExtra={
              <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-muted-foreground">
                <span>
                  Showing {data.meta.total === 0 ? 0 : data.meta.offset + 1}–
                  {Math.min(data.meta.offset + data.rows.length, data.meta.total)} of {data.meta.total} readings
                </span>
                <span>Preview of stored data. Readings from the last 15 minutes may not be included yet.</span>
              </div>
            }
          />
        )}
        {(!data || empty) && (
          <p className="text-xs text-muted-foreground">
            Preview of stored data. Readings from the last 15 minutes may not be included yet.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
