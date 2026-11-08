import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { errorMessage } from '@/lib/api'
import { createMachine, updateMachine } from '../api'
import { DATA_PATH_LABELS, type DataPath, type Machine, type MachineInput, type Range } from '../types'

type Props = {
  /** The machine to edit; omit to add one. */
  machine?: Machine
  onClose: () => void
}

/** A band of 0/0 means "not set", so it is shown as empty fields instead of as real numbers. */
function fields(range: Range | undefined): [string, string] {
  if (!range || (range.min === 0 && range.max === 0)) return ['', '']
  return [String(range.min), String(range.max)]
}

function toRange(min: string, max: string): Range {
  return { min: min === '' ? 0 : Number(min), max: max === '' ? 0 : Number(max) }
}

export function MachineDialog({ machine, onClose }: Props) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(machine?.name ?? '')
  const [type, setType] = useState(machine?.type ?? '')
  const [dataPath, setDataPath] = useState<DataPath>(machine?.data_path ?? 'plc_gateway')
  const [deviceId, setDeviceId] = useState(machine?.device_id ?? '')
  const [gatewayId, setGatewayId] = useState(machine?.gateway_id ?? '')
  const [cmdEnabled, setCmdEnabled] = useState(machine?.cmd_enabled ?? false)
  const [temp, setTemp] = useState(fields(machine?.thresholds.temperature))
  const [pressure, setPressure] = useState(fields(machine?.thresholds.pressure))
  const [problem, setProblem] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: (input: MachineInput) => (machine ? updateMachine(machine.id, input) : createMachine(input)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['machines'] }),
        queryClient.invalidateQueries({ queryKey: ['machine'] }),
      ])
      onClose()
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const thresholds = { temperature: toRange(...temp), pressure: toRange(...pressure) }
    const bands = [thresholds.temperature, thresholds.pressure]
    if (bands.some((r) => Number.isNaN(r.min) || Number.isNaN(r.max))) {
      setProblem('Thresholds must be numbers.')
      return
    }
    if (bands.some((r) => r.min > r.max)) {
      setProblem('A minimum threshold cannot be above its maximum.')
      return
    }
    setProblem(null)
    save.mutate({
      name: name.trim(),
      type: type.trim(),
      data_path: dataPath,
      device_id: deviceId.trim(),
      gateway_id: gatewayId.trim(),
      cmd_enabled: cmdEnabled,
      thresholds,
    })
  }

  const bandRow = (
    label: string,
    unit: string,
    value: [string, string],
    set: (v: [string, string]) => void,
    id: string,
  ) => (
    <div className="grid grid-cols-[6rem_1fr_1fr_3rem] items-center gap-3">
      <Label htmlFor={`${id}-min`}>{label}</Label>
      <Input
        id={`${id}-min`}
        type="number"
        step="any"
        placeholder="min"
        value={value[0]}
        onChange={(e) => set([e.target.value, value[1]])}
      />
      <Input
        id={`${id}-max`}
        type="number"
        step="any"
        placeholder="max"
        aria-label={`${label} max`}
        value={value[1]}
        onChange={(e) => set([value[0], e.target.value])}
      />
      <span className="text-sm text-muted-foreground">{unit}</span>
    </div>
  )

  return (
    <Dialog open onOpenChange={(open) => !open && !save.isPending && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{machine ? 'Edit Machine' : 'Add Machine'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="machine-name">Machine name</Label>
              <Input id="machine-name" required maxLength={100} autoFocus value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="machine-type">Machine type</Label>
              <Input id="machine-type" required maxLength={50} value={type} onChange={(e) => setType(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="machine-path">Data acquisition path</Label>
              <Select value={dataPath} onValueChange={(v) => setDataPath(v as DataPath)}>
                <SelectTrigger id="machine-path" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(DATA_PATH_LABELS) as DataPath[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {DATA_PATH_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="machine-device">Device identity on MQTT</Label>
              <Input
                id="machine-device"
                required
                maxLength={64}
                pattern="[A-Za-z0-9_\-]+"
                title="Letters, digits, - and _ only"
                placeholder="e.g. KMP-01"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="machine-gateway">Gateway ID</Label>
              <Input
                id="machine-gateway"
                maxLength={64}
                pattern="[A-Za-z0-9_\-]*"
                title="Letters, digits, - and _ only"
                placeholder="e.g. hmi-01, leave empty for direct IoT"
                value={gatewayId}
                onChange={(e) => setGatewayId(e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-primary"
              checked={cmdEnabled}
              onChange={(e) => setCmdEnabled(e.target.checked)}
            />
            <span>
              <span className="block font-medium">Enable ON/OFF control</span>
              <span className="text-muted-foreground">
                Authorized users can send ON/OFF commands for this machine. ON and OFF only.
              </span>
            </span>
          </label>

          <div className="flex flex-col gap-3 border-t pt-4">
            <h3 className="font-medium">Normal condition thresholds</h3>
            <p className="text-xs text-muted-foreground">Leave both fields empty when no band is set; it is never counted as abnormal.</p>
            {bandRow('Temperature', '°C', temp, setTemp, 'temp')}
            {bandRow('Pressure', 'mbar', pressure, setPressure, 'pressure')}
          </div>

          {(problem || save.isError) && (
            <p role="alert" className="text-sm text-destructive">
              {problem ?? errorMessage(save.error)}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? 'Saving…' : machine ? 'Save Changes' : 'Add Machine'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
