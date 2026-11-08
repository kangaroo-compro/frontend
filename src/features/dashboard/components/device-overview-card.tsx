import { Check, FileUp, Power, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PERMISSIONS } from '@/features/accounts/permissions'
import { useCan } from '@/features/auth/access'
import type { Condition } from '@/features/machines/condition'
import type { Machine } from '@/features/machines/types'
import type { MachineStatus } from '@/features/telemetry/types'
import { NO_VALUE } from '@/lib/format'

interface DeviceOverviewCardProps {
  machine: Machine
  machines: Machine[]
  onSelectMachine: (machineId: string) => void
  machineStatus?: MachineStatus
  condition: Condition | null
  onExport: () => void
  /** True when there is nothing to export yet. */
  exportDisabled: boolean
}

/** Machine name and badges on the left; the machine selector and Export on the right (stacked below md). */
export function DeviceOverviewCard({
  machine,
  machines,
  onSelectMachine,
  machineStatus,
  condition,
  onExport,
  exportDisabled,
}: DeviceOverviewCardProps) {
  const canExport = useCan(PERMISSIONS.dashboardExport)
  const connected = machine.status === 'connected'

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <CardTitle className="text-xl font-bold tracking-tight sm:text-2xl">{machine.name}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium">
                <Power className="size-3.5 stroke-[2.2]" aria-hidden />
                {machineStatus ? `Machine ${machineStatus}` : `Machine ${NO_VALUE}`}
              </Badge>

              {condition ? (
                <Badge
                  variant={condition === 'Abnormal' ? 'destructive' : 'outline'}
                  className="gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                >
                  {condition === 'Abnormal' ? <TriangleAlert className="size-3.5" aria-hidden /> : <Check className="size-3.5 stroke-[2.2]" aria-hidden />}
                  {condition}
                </Badge>
              ) : (
                <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs font-medium">
                  Condition {NO_VALUE}
                </Badge>
              )}

              <Badge variant="outline" className="gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium">
                <span className={`size-2 rounded-full ${connected ? 'bg-foreground' : 'bg-destructive'}`} aria-hidden />
                {connected ? 'Device connected' : 'Device disconnected'}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={machine.id} onValueChange={onSelectMachine}>
              <SelectTrigger aria-label="Select machine" className="w-48">
                <SelectValue placeholder="Select machine" />
              </SelectTrigger>
              <SelectContent>
                {machines.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canExport && (
              <Button variant="outline" onClick={onExport} disabled={exportDisabled}>
                <FileUp /> Export
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
