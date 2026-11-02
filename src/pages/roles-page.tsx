import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AddRoleDialog } from '@/features/accounts/components/add-role-dialog'
import { RoleEditor } from '@/features/accounts/components/role-editor'
import { listRoles } from '@/features/accounts/api'
import { PERMISSIONS } from '@/features/accounts/permissions'
import { useCan } from '@/features/auth/access'
import { errorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'

export function RolesPage() {
  const canRead = useCan(PERMISSIONS.roleRead)
  const canCreate = useCan(PERMISSIONS.roleCreate)
  const canUpdate = useCan(PERMISSIONS.roleUpdate)
  const canDelete = useCan(PERMISSIONS.roleDelete)

  const roles = useQuery({ queryKey: ['roles'], queryFn: listRoles, enabled: canRead })
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const selected = roles.data?.find((r) => r.id === pickedId) ?? roles.data?.[0]

  return (
    <div className="flex w-full flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Roles</h1>
      </header>

      {!canRead && <p className="text-sm text-muted-foreground">You don't have access to this page.</p>}
      {canRead && roles.isPending && <Skeleton className="h-64 w-full" />}
      {canRead && roles.isError && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(roles.error)}</AlertDescription>
        </Alert>
      )}

      {roles.isSuccess && (
        <div className="grid gap-6 md:grid-cols-[18rem_1fr]">
          <Card className="self-start">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Role name</CardTitle>
              {canCreate && (
                <Button size="sm" onClick={() => setAdding(true)}>
                  <Plus /> Add
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-1">
                {roles.data.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setPickedId(r.id)}
                      className={cn(
                        'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted',
                        r.id === selected?.id && 'bg-muted font-medium',
                      )}
                    >
                      {r.name}
                    </button>
                  </li>
                ))}
                {roles.data.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">No roles yet.</li>}
              </ul>
            </CardContent>
          </Card>

          {selected && (
            <RoleEditor
              key={`${selected.id}:${selected.updated_at}`}
              role={selected}
              canUpdate={canUpdate}
              canDelete={canDelete}
            />
          )}
        </div>
      )}

      {adding && <AddRoleDialog onCreated={(role) => setPickedId(role.id)} onClose={() => setAdding(false)} />}
    </div>
  )
}
