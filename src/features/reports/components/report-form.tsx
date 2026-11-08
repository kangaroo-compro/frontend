import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { PERMISSIONS } from '@/features/accounts/permissions'
import { useCan } from '@/features/auth/access'
import { errorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import { listMachines } from '@/features/machines/api'
import { createReport } from '../api'
import { periodError } from '../period'
import type { ReportFormat, ReportType } from '../types'
import { DateTimePicker } from './date-picker'
import { ReportPreview } from './report-preview'

const TYPES: { value: ReportType; title: string; description: string }[] = [
  {
    value: 'machine_condition',
    title: 'Machine Condition (summary, one row per machine)',
    description: 'Minimum, maximum, and average values plus abnormal events per machine. It does not list every reading.',
  },
  {
    value: 'full_sensor_data',
    title: 'Full Sensor Data (every reading)',
    description: 'All readings in chronological order for further analysis.',
  },
]

const FORMATS: { value: ReportFormat; label: string; ext: string }[] = [
  { value: 'xlsx', label: 'Excel', ext: '.xlsx' },
  { value: 'csv', label: 'csv', ext: '.csv' },
]

const HOUR = 3_600_000
const RANGES = [
  { key: '1h', label: '1 hour', ms: HOUR },
  { key: '24h', label: '24 hours', ms: 24 * HOUR },
  { key: '7d', label: '7 days', ms: 7 * 24 * HOUR },
  { key: '30d', label: '30 days', ms: 30 * 24 * HOUR },
] as const

function rangeEndingNow(ms: number) {
  const now = new Date()
  return { from: new Date(now.getTime() - ms), to: now }
}

export function ReportForm() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const canReadMachines = useCan(PERMISSIONS.machineRead)
  const machines = useQuery({ queryKey: ['machines', 'options'], queryFn: () => listMachines(200, 0).then((page) => page.machines), enabled: canReadMachines })

  const [type, setType] = useState<ReportType>('machine_condition')
  const [format, setFormat] = useState<ReportFormat>('xlsx')
  const [selected, setSelected] = useState<string[]>([])
  const [quick, setQuick] = useState<string | null>('24h')
  const [range, setRange] = useState(() => rangeEndingNow(24 * HOUR))

  const create = useMutation({
    mutationFn: () =>
      createReport({
        type,
        format,
        machine_ids: selected,
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reports'] })
      navigate('/report')
    },
  })

  const invalidPeriod = periodError(range.from, range.to)
  const all = machines.data ?? []

  function pickQuick(key: string, ms: number) {
    setQuick(key)
    setRange(rangeEndingNow(ms))
  }

  function setEdge(edge: 'from' | 'to', value: Date) {
    setQuick(null)
    setRange((r) => ({ ...r, [edge]: value }))
  }

  function toggle(id: string, on: boolean) {
    setSelected((prev) => (on ? [...prev, id] : prev.filter((x) => x !== id)))
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    create.mutate()
  }

  // The card and the live preview are two grid cells of the page, so they come back as siblings.
  return (
    <>
    <Card>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Report type</legend>
            <div className="grid gap-3 md:grid-cols-2">
              {TYPES.map((t) => (
                <label
                  key={t.value}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm',
                    type === t.value && 'bg-muted',
                  )}
                >
                  <input
                    type="radio"
                    name="report-type"
                    className="mt-1 size-4 accent-primary"
                    checked={type === t.value}
                    onChange={() => setType(t.value)}
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium">{t.title}</span>
                    <span className="text-muted-foreground">{t.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-6 md:grid-cols-2">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">Machines</legend>
              {!canReadMachines && (
                <p className="text-sm text-muted-foreground">
                  Your role cannot view machines, so none can be selected for a report.
                </p>
              )}
              {canReadMachines && machines.isPending && <Skeleton className="h-24 w-full" />}
              {machines.isError && (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage(machines.error)}</AlertDescription>
                </Alert>
              )}
              {machines.isSuccess && all.length === 0 && (
                <p className="text-sm text-muted-foreground">No machines registered yet.</p>
              )}
              {machines.isSuccess && all.length > 0 && (
                <div className="flex flex-col gap-1 rounded-lg border p-2">
                  <label className="flex items-center gap-2 px-1 py-1 text-sm font-medium">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={selected.length === all.length}
                      ref={(el) => {
                        if (el) el.indeterminate = selected.length > 0 && selected.length < all.length
                      }}
                      onChange={(e) => setSelected(e.target.checked ? all.map((m) => m.id) : [])}
                    />
                    Select all
                  </label>
                  <div className="flex max-h-40 flex-col gap-1 overflow-y-auto border-t pt-1">
                    {all.map((m) => (
                      <label key={m.id} className="flex items-center gap-2 px-1 py-1 text-sm">
                        <input
                          type="checkbox"
                          className="size-4 accent-primary"
                          checked={selected.includes(m.id)}
                          onChange={(e) => toggle(m.id, e.target.checked)}
                        />
                        {m.name}
                        <span className="text-xs text-muted-foreground">{m.device_id}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">File format</legend>
              <div className="grid grid-cols-2 gap-3">
                {FORMATS.map((f) => (
                  <label
                    key={f.value}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                      format === f.value && 'bg-muted',
                    )}
                  >
                    <input
                      type="radio"
                      name="report-format"
                      className="size-4 accent-primary"
                      checked={format === f.value}
                      onChange={() => setFormat(f.value)}
                    />
                    {f.label}
                    <span className="text-xs text-muted-foreground">{f.ext}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-sm font-medium">Period</legend>
            <ToggleGroup
              type="single"
              variant="outline"
              aria-label="Quick range"
              className="w-full"
              value={quick ?? ''}
              onValueChange={(key) => {
                const r = RANGES.find((x) => x.key === key)
                if (r) pickQuick(r.key, r.ms) // an empty value means the user clicked the active one: keep it
              }}
            >
              {RANGES.map((r) => (
                <ToggleGroupItem key={r.key} value={r.key} className="flex-1">
                  {r.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="report-from">From</Label>
                <DateTimePicker id="report-from" value={range.from} onChange={(d) => setEdge('from', d)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="report-to">To</Label>
                <DateTimePicker id="report-to" value={range.to} onChange={(d) => setEdge('to', d)} />
              </div>
            </div>
            {invalidPeriod && <p className="text-sm text-destructive">{invalidPeriod}</p>}
          </fieldset>

          {create.isError && (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage(create.error)}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/report')} disabled={create.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending || selected.length === 0 || invalidPeriod !== null}>
              <Download /> {create.isPending ? 'Queuing…' : 'Generate report'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
    <ReportPreview type={type} machines={all} selectedIds={selected} from={range.from} to={range.to} />
    </>
  )
}
