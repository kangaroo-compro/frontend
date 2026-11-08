import { Check, Power, TriangleAlert } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Condition } from '@/features/machines/condition'
import type { Machine } from '@/features/machines/types'
import type { MachineStatus } from '@/features/telemetry/types'
import { NO_VALUE } from '@/lib/format'

interface DeviceOverviewCardProps {
  machine: Machine
  /** Machines for the selector; empty when the role cannot list machines. */
  machines: Machine[]
  onSelectMachine: (machineId: string) => void
  machineStatus?: MachineStatus
  condition: Condition | null
}

export function DeviceOverviewCard({ machine, machines, onSelectMachine, machineStatus, condition }: DeviceOverviewCardProps) {
  const connected = machine.status === 'connected'
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{machine.name}</h2>
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

        {machines.length > 0 && (
          <Select value={machine.id} onValueChange={onSelectMachine}>
            <SelectTrigger aria-label="Select machine" className="w-[180px] rounded-lg self-start sm:self-center">
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
        )}
      </CardContent>
    </Card>
  )
}
