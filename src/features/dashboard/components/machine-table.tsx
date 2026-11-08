import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DataTable, type Column } from '@/components/data-table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { condition, type Condition } from '@/features/machines/condition'
import type { Machine } from '@/features/machines/types'
import { formatReading, NO_VALUE } from '@/lib/format'
import type { LatestReading } from '../types'

type Props = {
  machines?: Machine[]
  latest: Record<string, LatestReading>
  canRead: boolean
  loading: boolean
  error?: string
}

type Filter = 'all' | Condition

const noop = () => {}

export function ConditionBadge({ value }: { value: Condition | null }) {
  if (value === null) return <span className="text-muted-foreground">{NO_VALUE}</span>
  return (
    <Badge variant={value === 'Abnormal' ? 'destructive' : 'outline'} className="rounded-full px-2.5 font-normal">
      {value}
    </Badge>
  )
}

export function ConnectivityBadge({ status }: { status: Machine['status'] }) {
  return (
    <Badge variant={status === 'connected' ? 'outline' : 'secondary'} className="rounded-full px-2.5 font-normal">
      {status === 'connected' ? 'Connected' : 'Disconnected'}
    </Badge>
  )
}

/** "List of Machines": live values from the shared socket, search and a Conditions filter in the browser. */
export function MachineTable({ machines, latest, canRead, loading, error }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const rows = (machines ?? []).map((machine) => {
    const reading = latest[machine.device_id]
    return { machine, reading, condition: reading ? condition(reading.readings, machine.thresholds) : null }
  })
  const shown = rows.filter(
    (r) =>
      r.machine.name.toLowerCase().includes(search.trim().toLowerCase()) && (filter === 'all' || r.condition === filter),
  )

  const columns: Column<(typeof rows)[number]>[] = [
    { key: 'machine', header: 'Machine', cell: (r) => r.machine.name },
    { key: 'status', header: 'Status', cell: (r) => r.reading?.readings.status ?? NO_VALUE },
    { key: 'temperature', header: 'Temperature (°C)', cell: (r) => formatReading(r.reading?.readings.temperature) },
    { key: 'pressure', header: 'Pressure (mbar)', cell: (r) => formatReading(r.reading?.readings.pressure) },
    { key: 'hours', header: 'Running hours (h)', cell: (r) => formatReading(r.reading?.readings.runningHours, '', 0) },
    { key: 'condition', header: 'Conditions', cell: (r) => <ConditionBadge value={r.condition} /> },
    { key: 'connectivity', header: 'Connectivity', cell: (r) => <ConnectivityBadge status={r.machine.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      cell: (r) => (
        <Link to={`/dashboard/${r.machine.id}`} className="text-sm font-medium underline-offset-4 hover:underline">
          Detail
        </Link>
      ),
    },
  ]

  return (
    <Card className="rounded-xl border bg-card shadow-xs">
      <CardHeader className="flex flex-col gap-3 p-5 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-lg font-bold tracking-tight text-foreground">List of Machines</CardTitle>
        {canRead && (
          <div className="flex flex-wrap items-center gap-3">
            <Input
              aria-label="Search machine"
              placeholder="Search Machine"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 rounded-full"
            />
            <div className="flex items-center gap-2 text-sm">
              <span id="condition-filter-label">Conditions</span>
              <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
                <SelectTrigger aria-labelledby="condition-filter-label" className="w-28 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Abnormal">Abnormal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {!canRead && <p className="text-sm text-muted-foreground">You don't have access to machine data.</p>}
        {canRead && loading && <Skeleton className="h-40 w-full" />}
        {canRead && error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {canRead && machines && (
          <DataTable
            data={shown}
            columns={columns}
            rowKey={(r) => r.machine.id}
            empty={machines.length === 0 ? 'No machines registered yet.' : 'No machine matches the search or filter.'}
            page={1}
            onPageChange={noop}
          />
        )}
      </CardContent>
    </Card>
  )
}
