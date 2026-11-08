import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Power, TriangleAlert, X } from 'lucide-react'
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
/** How long the "Done" alert stays before it clears itself. */
const SUCCESS_VISIBLE_MS = 4_000

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
function outcomeOf(
  ack: CommandAck | undefined,
  timedOut: boolean,
  succeeded: boolean,
): { text: string; tone: 'success' | 'warning' | 'danger' } {
  if (succeeded) return { text: 'Done', tone: 'success' }
  if (ack && isFinalAck(ack)) {
    const why = ack.reason ? (REASONS[ack.reason] ?? ack.reason) : ''
    return { text: `${ack.result === 'REJECTED' ? 'Rejected' : 'Failed'}${why ? `: ${why}` : ''}`, tone: 'danger' }
  }
  if (timedOut) return { text: 'No response from the machine', tone: 'danger' }
  if (ack) return { text: 'Accepted, waiting for the machine', tone: 'warning' }
  return { text: 'Sent, waiting for the machine', tone: 'warning' }
}

export function ControlCard({ machine, status, acks }: ControlCardProps) {
  const canTurn = useCan(PERMISSIONS.turnMachine)
  const [confirm, setConfirm] = useState<CommandName | null>(null)
  const [sent, setSent] = useState<Sent | null>(null)
  const [timedOutId, setTimedOutId] = useState<string | null>(null)
  // cmd_id of the command whose commanded state the live machine status has reached (kept even if the status changes later).
  const [reachedId, setReachedId] = useState<string | null>(null)
  // cmd_id whose alert is hidden: a success after SUCCESS_VISIBLE_MS, or an error the user dismissed.
  const [hiddenId, setHiddenId] = useState<string | null>(null)

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

  // The live status is the truth: once it equals the commanded state the command worked, ack or no ack.
  const reachedNow = sent !== null && status === sent.command
  if (sent && reachedNow && reachedId !== sent.cmdId) setReachedId(sent.cmdId) // latch it, guarded so it renders once more at most

  const ack = sent ? acks[sent.cmdId] : undefined
  const succeeded = sent !== null && (reachedNow || reachedId === sent.cmdId || ack?.result === 'EXECUTED')
  const failed = !succeeded && isFinalAck(ack)
  const timedOut = sent !== null && timedOutId === sent.cmdId && !succeeded && !failed
  const busy = send.isPending || (sent !== null && !succeeded && !failed && !timedOut)
  const outcome = sent ? outcomeOf(ack, timedOut, succeeded) : undefined
  // A success shows briefly, then goes; an error stays until dismissed or until the machine reaches the state.
  const alertVisible = outcome !== undefined && hiddenId !== sent?.cmdId

  const successId = succeeded ? sent?.cmdId : undefined
  useEffect(() => {
    if (!successId) return
    const timer = setTimeout(() => setHiddenId(successId), SUCCESS_VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [successId])

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
        {outcome && alertVisible && (
          <div className="flex items-start gap-1">
            <Badge
              role="status"
              variant={outcome.tone}
              className="h-auto w-fit max-w-full whitespace-normal rounded-xl px-2.5 py-1 text-left text-xs font-normal"
            >
              {outcome.text}
            </Badge>
            {outcome.tone === 'danger' && sent && (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Dismiss"
                onClick={() => setHiddenId(sent.cmdId)}
              >
                <X />
              </Button>
            )}
          </div>
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
