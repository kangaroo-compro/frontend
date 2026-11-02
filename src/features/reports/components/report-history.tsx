import { useInfiniteQuery, useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Download } from 'lucide-react'
import { DataTable, type Column } from '@/components/data-table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { errorMessage } from '@/lib/api'
import { formatBytes } from '@/lib/format'
import { listReports, reportDownloadUrl } from '../api'
import { useReportEvents } from '../hooks/use-report-events'
import type { Report } from '../types'

const PAGE_SIZE = 10

const TYPE_LABEL = { machine_condition: 'Machine condition', full_sensor_data: 'Full sensor data' } as const

const when = (iso: string) => format(new Date(iso), 'd MMM yyyy, HH:mm')

function machineNames(r: Report): string {
  const names = r.machines.map((m) => m.name)
  return names.length <= 2 ? names.join(', ') : `${names.slice(0, 2).join(', ')} +${names.length - 2}`
}

function StatusBadge({ report }: { report: Report }) {
  if (report.status === 'ready') return <Badge>Ready</Badge>
  if (report.status === 'pending') return <Badge variant="secondary">Generating…</Badge>
  return <Badge variant="destructive">Failed</Badge>
}

export function ReportHistory() {
  useReportEvents()

  const reports = useInfiniteQuery({
    queryKey: ['reports'],
    queryFn: ({ pageParam }) => listReports(PAGE_SIZE, pageParam),
    initialPageParam: 0,
    getNextPageParam: ({ meta }) => (meta.offset + meta.limit < meta.total ? meta.offset + meta.limit : undefined),
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
          <DataTable
            data={reports.data.pages.flatMap((p) => p.reports)}
            columns={columns}
            rowKey={(r) => r.id}
            empty="No reports yet."
            meta={reports.data.pages.at(-1)?.meta}
            onLoadMore={() => reports.fetchNextPage()}
            loadingMore={reports.isFetchingNextPage}
          />
        )}
      </CardContent>
    </Card>
  )
}
