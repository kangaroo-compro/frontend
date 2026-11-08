import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Power, TriangleAlert } from 'lucide-react'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PERMISSIONS } from '@/features/accounts/permissions'
import { useCan } from '@/features/auth/access'
import type { Machine } from '@/features/machines/types'
import { sendCommand } from '@/features/telemetry/api'
import { isFinalAck } from '@/features/telemetry/ack'
import type { CommandAck, CommandName, MachineStatus } from '@/features/telemetry/types'
import { errorMessage } from '@/lib/api'

/** The HMI answers within 8 s (MQTT.md 3.5); the Manager command itself is valid for 10 s. */
const NO_RESPONSE_MS = 15_000

type Sent = { cmdId: string; command: CommandName; at: number }

interface ControlCardProps {
  machine: Machine
  /** Latest machine status from telemetry; undefined when none has arrived. */
  status?: MachineStatus
  /** Acks received on the socket, by cmd_id. */
  acks: Record<string, CommandAck>
}

const REASONS: Record<string, string> = {
  EMERGENCY_ACTIVE: 'The emergency stop is active.',
  INVALID_PAYLOAD: 'The machine could not read the command.',
  NO_FEEDBACK: 'The machine did not change state within 8 seconds.',
}

/** What the card tells the user about the command that was sent. */
function outcomeOf(ack: CommandAck | undefined, timedOut: boolean): { text: string; failed: boolean } {
  if (ack && isFinalAck(ack)) {
    if (ack.result === 'EXECUTED') return { text: 'Done', failed: false }
    const why = ack.reason ? (REASONS[ack.reason] ?? ack.reason) : ''
    return { text: `${ack.result === 'REJECTED' ? 'Rejected' : 'Failed'}${why ? `: ${why}` : ''}`, failed: true }
  }
  if (timedOut) return { text: 'No response from the machine', failed: true }
  if (ack) return { text: 'Accepted, waiting for the machine', failed: false }
  return { text: 'Sent, waiting for the machine', failed: false }
}

export function ControlCard({ machine, status, acks }: ControlCardProps) {
  const canTurn = useCan(PERMISSIONS.turnMachine)
  const [confirm, setConfirm] = useState<CommandName | null>(null)
  const [sent, setSent] = useState<Sent | null>(null)
  const [timedOutId, setTimedOutId] = useState<string | null>(null)

  const send = useMutation({
    mutationFn: (command: CommandName) => sendCommand(machine.device_id, command),
    onSuccess: (cmdId, command) => setSent({ cmdId, command, at: Date.now() }),
    onSettled: () => setConfirm(null),
  })

  // No final ack in time: say so, and let the buttons work again.
  const pendingId = sent?.cmdId
  useEffect(() => {
    if (!pendingId) return
    const timer = setTimeout(() => setTimedOutId(pendingId), NO_RESPONSE_MS)
    return () => clearTimeout(timer)
  }, [pendingId])

  const ack = sent ? acks[sent.cmdId] : undefined
  const done = isFinalAck(ack)
  const timedOut = sent !== null && timedOutId === sent.cmdId && !done
  const busy = send.isPending || (sent !== null && !done && !timedOut)
  const outcome = sent ? outcomeOf(ack, timedOut) : undefined

  const blocked = !canTurn
    ? 'You are not authorized'
    : !machine.cmd_enabled
      ? 'ON/OFF control is disabled for this machine'
      : machine.status !== 'connected'
        ? 'Machine is disconnected'
        : null

  const button = (command: CommandName) => (
    <Button
      variant="outline"
      disabled={blocked !== null || busy || status === command}
      onClick={() => setConfirm(command)}
      className="gap-2 rounded-lg font-medium"
    >
      <Power className="size-4" aria-hidden />
      {command === 'ON' ? 'Turn ON' : 'Turn Off'}
    </Button>
  )

  return (
    <Card className="h-full w-full">
      <CardHeader>
        <CardTitle className="text-lg font-bold tracking-tight">ON/OFF Control</CardTitle>
        {canTurn && (
          <CardAction>
            <Badge variant="secondary" className="rounded-full px-3 py-0.5 text-xs font-medium">
              You are authorized
            </Badge>
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <p className="text-xs text-muted-foreground leading-relaxed">
          ON and OFF commands only. Speed, pressure, and set points cannot be changed from the dashboard.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {button('ON')}
          {button('OFF')}
        </div>

        {blocked && <p className="text-xs text-muted-foreground">{blocked}</p>}
        {send.isError && (
          <p role="alert" className="text-xs text-destructive">
            {errorMessage(send.error)}
          </p>
        )}
        {outcome && (
          <p role="status" className={`text-xs ${outcome.failed ? 'text-destructive' : 'text-foreground'}`}>
            {outcome.text}
          </p>
        )}

        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-foreground">Last command (this session)</h4>
          <p className="text-xs text-muted-foreground">
            {sent && outcome
              ? `${sent.command} · ${new Date(sent.at).toLocaleTimeString([], { hour12: false })} · ${outcome.text}`
              : 'No command sent from this browser yet.'}
          </p>
        </div>

        <Alert className="rounded-xl border border-muted-foreground/20 bg-muted/40 p-3 text-muted-foreground">
          <TriangleAlert className="size-4 text-muted-foreground shrink-0" aria-hidden />
          <AlertDescription className="text-[11px] leading-relaxed text-muted-foreground">
            This function does not replace the emergency stop, safety PLC, or the machine's built-in protection. Use it in accordance with PERURI's operating procedures and safety requirements.
          </AlertDescription>
        </Alert>
      </CardContent>

      {confirm && (
        <Dialog open onOpenChange={(open) => !open && !send.isPending && setConfirm(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Turn {confirm === 'ON' ? 'ON' : 'OFF'} {machine.name}?
              </DialogTitle>
              <DialogDescription>
                The command is sent to the machine now and expires after 10 seconds. Make sure it is safe to do so.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirm(null)} disabled={send.isPending}>
                Cancel
              </Button>
              <Button onClick={() => send.mutate(confirm)} disabled={send.isPending}>
                {send.isPending ? 'Sending…' : `Turn ${confirm === 'ON' ? 'ON' : 'OFF'}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}
