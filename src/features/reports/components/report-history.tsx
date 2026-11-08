import { keepPreviousData, useQuery, useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Download, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DataTable, type Column } from '@/components/data-table'
import { IconButton } from '@/components/icon-button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { PERMISSIONS } from '@/features/accounts/permissions'
import { useCan } from '@/features/auth/access'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { usePageSize } from '@/hooks/use-page-size'
import { errorMessage } from '@/lib/api'
import { formatBytes } from '@/lib/format'
import { listReports, reportDownloadUrl } from '../api'
import { useReportEvents } from '../hooks/use-report-events'
import type { Report } from '../types'
import * as React from 'react'

const SEARCH_DEBOUNCE_MS = 300

const TYPE_LABEL = { machine_condition: 'Machine condition', full_sensor_data: 'Full sensor data' } as const

const when = (iso: string) => format(new Date(iso), 'd MMM yyyy, HH:mm')

function machineNames(r: Report): string {
  const names = r.machines.map((m) => m.name)
  return names.length <= 2 ? names.join(', ') : `${names.slice(0, 2).join(', ')} +${names.length - 2}`
}

function StatusBadge({ report }: { report: Report }) {
  if (report.status === 'ready') return <Badge variant="success">Ready</Badge>
  if (report.status === 'pending') return <Badge variant="warning">Generating…</Badge>
  return <Badge variant="danger">Failed</Badge>
}

export function ReportHistory() {
  useReportEvents()

  const canGenerate = useCan(PERMISSIONS.reportGenerate)
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = usePageSize('reports', 10)
  const [search, setSearch] = React.useState('')
  const debounced = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS)

  const reports = useQuery({
    queryKey: ['reports', page, debounced, pageSize],
    queryFn: () => listReports(pageSize, (page - 1) * pageSize, debounced),
    placeholderData: keepPreviousData,
  })

  const download = useMutation({
    mutationFn: reportDownloadUrl,
    onSuccess: (url) => window.location.assign(url),
  })

  const columns: Column<Report>[] = [
    { key: 'created', header: 'Created', className: 'whitespace-nowrap', cell: (r) => when(r.created_at) },
    {
      key: 'report',
      header: 'Report',
      cell: (r) => (
        <>
          <div className="font-medium">{TYPE_LABEL[r.type]}</div>
          <div className="text-xs text-muted-foreground">.{r.format}</div>
        </>
      ),
    },
    { key: 'machines', header: 'Machines', cell: machineNames },
    {
      key: 'period',
      header: 'Period',
      className: 'whitespace-nowrap text-xs',
      cell: (r) => (
        <>
          {when(r.from)}
          <br />
          {when(r.to)}
        </>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <>
          <StatusBadge report={r} />
          {r.status === 'failed' && r.error && <div className="mt-1 max-w-48 text-xs text-destructive">{r.error}</div>}
        </>
      ),
    },
    { key: 'size', header: 'Size', cell: (r) => (r.status === 'ready' ? formatBytes(r.size_bytes) : '–') },
    { key: 'by', header: 'Requested by', cell: (r) => r.created_by_name },
    {
      key: 'action',
      header: 'Action',
      className: 'text-right',
      cell: (r) =>
        r.status === 'ready' && (
          <Button
            variant="ghost"
            size="sm"
            disabled={download.isPending && download.variables === r.id}
            onClick={() => download.mutate(r.id)}
          >
            <Download /> Download
          </Button>
        ),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold tracking-tight">Generated Reports</CardTitle>
        <CardAction className="flex flex-wrap items-center gap-3">
          <Input
            aria-label="Search report"
            placeholder="Search Report"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-56"
          />
          {canGenerate && (
            <IconButton label="Generate report" asChild>
              <Link to="/report/new">
                <Plus />
              </Link>
            </IconButton>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {reports.isPending && <Skeleton className="h-40 w-full" />}
        {reports.isError && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage(reports.error)}</AlertDescription>
          </Alert>
        )}
        {download.isError && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage(download.error)}</AlertDescription>
          </Alert>
        )}
        {reports.isSuccess && (
          <DataTable<Report>
            data={reports.data.reports}
            columns={columns}
            rowKey={(r) => r.id}
            empty={debounced ? 'No report matches the search.' : 'No reports yet.'}
            meta={reports.data.meta}
            page={page}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
        )}
      </CardContent>
    </Card>
  )
}
