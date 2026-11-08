import * as React from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { DataTable, type Column } from '@/components/data-table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { PERMISSIONS } from '@/features/accounts/permissions'
import { useCan } from '@/features/auth/access'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { errorMessage } from '@/lib/api'
import { listUsers } from '../api'
import type { User } from '../types'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

export function UserList() {
  const canCreate = useCan(PERMISSIONS.userCreate)
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState('')
  const debounced = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS)

  const users = useQuery({
    queryKey: ['users', page, debounced],
    queryFn: () => listUsers(PAGE_SIZE, (page - 1) * PAGE_SIZE, debounced),
    placeholderData: keepPreviousData,
  })

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (user) => user.name,
    },
    {
      key: 'email',
      header: 'Email',
      cell: (user) => user.email,
    },
    {
      key: 'role',
      header: 'Role',
      cell: (user) => user.role_name,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold tracking-tight">
          Registered Users {users.data ? `(${users.data.meta.total})` : ''}
        </CardTitle>
        <CardAction className="flex flex-wrap items-center gap-3">
          <Input
            aria-label="Search user"
            placeholder="Search User"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-56"
          />
          {canCreate && (
            <Button>
              <Plus /> Add User
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <CardContent>
        {users.isPending && <Skeleton className="h-40 w-full" />}

        {users.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {errorMessage(users.error)}
            </AlertDescription>
          </Alert>
        )}

        {users.isSuccess && (
          <DataTable
            data={users.data.data}
            columns={columns}
            rowKey={(user) => user.id}
            empty={debounced ? 'No user matches the search.' : 'No users yet.'}
            meta={users.data.meta}
            page={page}
            onPageChange={setPage}
          />
        )}
      </CardContent>
    </Card>
  )
}
