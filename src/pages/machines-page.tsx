import { PERMISSIONS } from '@/features/accounts/permissions'
import { useCan } from '@/features/auth/access'
import { MachineList } from '@/features/machines/components/machine-list'

export function MachinesPage() {
  const canRead = useCan(PERMISSIONS.machineRead)

  return (
    <div className="flex w-full flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Machine</h1>
      </header>
      {canRead ? (
        <MachineList />
      ) : (
        <p className="text-sm text-muted-foreground">You don't have access to this page.</p>
      )}
    </div>
  )
}
