import { PERMISSIONS } from '@/features/accounts/permissions'
import { useCan } from '@/features/auth/access'
import { UserList } from '@/features/users/components/user-list'

export function UsersPage() {
  const canRead = useCan(PERMISSIONS.userRead)

  return (
    <div className="flex w-full flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Manage Users
        </h1>
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
