import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PERMISSIONS } from '@/features/accounts/permissions'
import { useCan } from '@/features/auth/access'
import { UserList } from '@/features/users/components/user-list'

export function UsersPage() {
  const canRead = useCan(PERMISSIONS.userRead)
  const canCreate = useCan(PERMISSIONS.userCreate)

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Manage Users
        </h1>

        {canRead && canCreate && (
          <Button>
            <Plus /> Add User
          </Button>
        )}
      </header>

      {canRead ? (
        <UserList />
      ) : (
        <p className="text-sm text-muted-foreground">
          You don't have access to this page.
        </p>
      )}
    </div>
  )
}