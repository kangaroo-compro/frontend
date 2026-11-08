import { useEffect, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { DataTable, type Column } from '@/components/data-table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { PERMISSIONS } from '@/features/accounts/permissions'
import { ConfirmDeleteDialog } from '@/features/accounts/components/confirm-delete-dialog'
import { useCan } from '@/features/auth/access'
import { ConnectivityBadge } from '@/features/dashboard/components/machine-table'
import { errorMessage } from '@/lib/api'
import { NO_VALUE } from '@/lib/format'
import { deleteMachine, listMachines } from '../api'
import { DATA_PATH_LABELS, type Machine } from '../types'
import { MachineDialog } from './machine-dialog'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

export function MachineList() {
  const queryClient = useQueryClient()
  const canCreate = useCan(PERMISSIONS.machineCreate)
  const canUpdate = useCan(PERMISSIONS.machineUpdate)
  const canDelete = useCan(PERMISSIONS.machineDelete)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [editing, setEditing] = useState<Machine | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Machine | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [search])

  const machines = useQuery({
    queryKey: ['machines', 'list', page, debounced],
    queryFn: () => listMachines(PAGE_SIZE, (page - 1) * PAGE_SIZE, debounced),
    placeholderData: keepPreviousData,
  })

  const remove = useMutation({
    mutationFn: (m: Machine) => deleteMachine(m.id),
    onSuccess: async () => {
      // Deleting the last row of the last page leaves that page empty.
      if (page > 1 && machines.data?.machines.length === 1) setPage(page - 1)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['machines'] }),
        queryClient.invalidateQueries({ queryKey: ['machine'] }),
      ])
      setDeleting(null)
    },
  })

  const columns: Column<Machine>[] = [
    { key: 'name', header: 'Machine', cell: (m) => m.name },
    { key: 'device', header: 'Device ID', cell: (m) => m.device_id },
    { key: 'gateway', header: 'Gateway', cell: (m) => m.gateway_id || NO_VALUE },
    { key: 'path', header: 'Data Path', cell: (m) => DATA_PATH_LABELS[m.data_path] },
    {
      key: 'control',
      header: 'ON/OFF Control',
      cell: (m) => (
        <Badge variant="outline" className="rounded-full px-2.5 font-normal">
          {m.cmd_enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      ),
    },
    { key: 'status', header: 'Status', cell: (m) => <ConnectivityBadge status={m.status} /> },
    {
      key: 'actions',
      header: 'Action',
      cell: (m) => (
        <div className="flex gap-2">
          {canUpdate && (
            <Button size="sm" variant="outline" onClick={() => setEditing(m)}>
              Edit
            </Button>
          )}
          {canDelete && (
            <Button size="sm" variant="outline" onClick={() => setDeleting(m)}>
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <Card className="rounded-xl border bg-card shadow-xs">
      <CardHeader className="flex flex-col gap-3 p-5 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-lg font-bold tracking-tight text-foreground">
          Registered Machines {machines.data ? `(${machines.data.meta.total})` : ''}
        </CardTitle>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              aria-label="Search machine"
              placeholder="Search Machine"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-56 rounded-full pl-9"
            />
          </div>
          {canCreate && (
            <Button onClick={() => setEditing('new')}>
              <Plus /> Add Machine
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {machines.isPending && <Skeleton className="h-40 w-full" />}
        {machines.isError && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage(machines.error)}</AlertDescription>
          </Alert>
        )}
        {machines.isSuccess && (
          <DataTable
            data={machines.data.machines}
            columns={columns}
            rowKey={(m) => m.id}
            empty={debounced ? 'No machine matches the search.' : 'No machines registered yet.'}
            meta={machines.data.meta}
            page={page}
            onPageChange={setPage}
          />
        )}
      </CardContent>

      {editing && <MachineDialog machine={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDeleteDialog
          title="Delete machine"
          description={`Delete ${deleting.name}? Telemetry already stored for ${deleting.device_id} stays.`}
          pending={remove.isPending}
          error={remove.isError ? errorMessage(remove.error) : null}
          onConfirm={() => remove.mutate(deleting)}
          onClose={() => {
            remove.reset()
            setDeleting(null)
          }}
        />
      )}
    </Card>
  )
}
