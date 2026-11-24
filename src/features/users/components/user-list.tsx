import * as React from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, Plus, UserCheck, UserX, Pencil, Trash2 } from 'lucide-react'
import { DataTable, type Column } from '@/components/data-table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconButton } from '@/components/icon-button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDeleteDialog } from '@/features/accounts/components/confirm-delete-dialog'
import { PERMISSIONS } from '@/features/accounts/permissions'
import { useCan } from '@/features/auth/access'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { usePageSize } from '@/hooks/use-page-size'
import { errorMessage } from '@/lib/api'
import { deleteUser, listUsers, toggleUserStatus } from '../api'
import type { User } from '../types'
import { UserDialog } from './user-dialog'

const SEARCH_DEBOUNCE_MS = 300

export function UserList() {
  const queryClient = useQueryClient()
  const canCreate = useCan(PERMISSIONS.userCreate)
  const canUpdate = useCan(PERMISSIONS.userUpdate)
  const canDelete = useCan(PERMISSIONS.userDelete)

  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = usePageSize('users', 10)
  const [search, setSearch] = React.useState('')
  const debounced = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS)

  // Dialog states
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  const users = useQuery({
    queryKey: ['users', page, debounced, pageSize],
    queryFn: () => listUsers(pageSize, (page - 1) * pageSize, debounced),
    placeholderData: keepPreviousData,
  })

  const toggleMutation = useMutation({
    mutationFn: (userId: string) => toggleUserStatus(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      setUserToDelete(null)
      setDeleteError(null)
    },
    onError: (err) => {
      setDeleteError(errorMessage(err))
    },
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
    {
      key: 'status',
      header: 'Status',
      cell: (user) => (
        <Badge variant={user.status === 1 ? 'success' : 'secondary'}>
          {user.status === 1 ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      className: 'w-20',
      cell: (user) => {
        const hasAnyAction = canUpdate || canDelete
        if (!hasAnyAction) return null

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {canUpdate && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedUser(user)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => toggleMutation.mutate(user.id)}
                    disabled={toggleMutation.isPending}
                  >
                    {user.status === 1 ? (
                      <>
                        <UserX className="mr-2 size-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-2 size-4" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                </>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      setUserToDelete(user)
                      setDeleteError(null)
                    }}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold tracking-tight">Registered Users</CardTitle>
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
              <IconButton
                label="Add user"
                onClick={() => {
                  setSelectedUser(null)
                  setDialogOpen(true)
                }}
              >
                <Plus />
              </IconButton>
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
              pageSize={pageSize}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setPage(1)
              }}
            />
          )}
        </CardContent>
      </Card>

      {dialogOpen && (
        <UserDialog
          user={selectedUser}
          onClose={() => {
            setDialogOpen(false)
            setSelectedUser(null)
          }}
        />
      )}

      {userToDelete && (
        <ConfirmDeleteDialog
          title="Delete User"
          description={`Are you sure you want to delete user "${userToDelete.name}" (${userToDelete.email})? This action cannot be undone.`}
          pending={deleteMutation.isPending}
          error={deleteError}
          onConfirm={() => deleteMutation.mutate(userToDelete.id)}
          onClose={() => {
            setUserToDelete(null)
            setDeleteError(null)
          }}
        />
      )}
    </>
  )
}
