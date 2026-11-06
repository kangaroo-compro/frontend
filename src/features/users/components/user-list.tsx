import * as React from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { DataTable, type Column } from '@/components/data-table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { errorMessage } from '@/lib/api'
import { listUsers } from '../api'
import type { User } from '../types'

const PAGE_SIZE = 10

export function UserList() {
  const [page, setPage] = React.useState(1)

  const users = useQuery({
    queryKey: ['users', page],
    queryFn: () => listUsers(PAGE_SIZE, (page - 1) * PAGE_SIZE),
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
      <CardContent className="flex flex-col gap-3">
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
            empty="No users yet."
            meta={users.data.meta}
            page={page}
            onPageChange={setPage}
          />
        )}
      </CardContent>
    </Card>
  )
}