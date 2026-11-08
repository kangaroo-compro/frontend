import { Info } from 'lucide-react'
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
        <>
          <p className="flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            <Info className="size-4 shrink-0" aria-hidden />
            The number of monitored machines depends on the availability of sensors and devices, and on technical
            validation in the field.
          </p>
          <MachineList />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">You don't have access to this page.</p>
      )}
    </div>
  )
}
