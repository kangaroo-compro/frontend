import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Machine } from '@/features/machines/types'
import { DateTimePicker } from '@/features/reports/components/date-picker'

export type Params = { temperature: boolean; pressure: boolean; runningHours: boolean; status: boolean }

export type HistoryFilter = { machineId: string; from: Date; to: Date; params: Params }

const HOUR = 3_600_000
const QUICK = [
  { label: '1 hour', ms: HOUR },
  { label: '24 hours', ms: 24 * HOUR },
  { label: '7 days', ms: 7 * 24 * HOUR },
]
const MAX_SPAN_MS = 31 * 24 * HOUR

const PARAMS: { key: keyof Params; label: string }[] = [
  { key: 'temperature', label: 'Temperature' },
  { key: 'pressure', label: 'Pressure' },
  { key: 'runningHours', label: 'Running hours' },
  { key: 'status', label: 'Machine status' },
]

function rangeEndingNow(ms: number): { from: Date; to: Date } {
  const to = new Date()
  return { from: new Date(to.getTime() - ms), to }
}

/** Why the range cannot be applied, or null. */
function rangeProblem(from: Date, to: Date): string | null {
  if (to.getTime() <= from.getTime()) return 'The end must be after the start.'
  if (to.getTime() - from.getTime() > MAX_SPAN_MS) return 'The range can span at most 31 days.'
  return null
}

type Props = {
  machines: Machine[]
  value: HistoryFilter
  onChange: (next: HistoryFilter) => void
  onApply: () => void
}

export function HistoryFilters({ machines, value, onChange, onApply }: Props) {
  const problem = rangeProblem(value.from, value.to)
  const span = value.to.getTime() - value.from.getTime()

  function quick(ms: number) {
    onChange({ ...value, ...rangeEndingNow(ms) })
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        {/* Every field is a Label over an h-8 control, so they share one baseline: 1 column below sm, 2 from sm, 4 from lg. */}
        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="history-machine">Machine</Label>
            <Select value={value.machineId} onValueChange={(machineId) => onChange({ ...value, machineId })}>
              <SelectTrigger id="history-machine" className="w-full rounded-lg">
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
          </div>

          <div className="flex flex-col gap-2">
            <Label id="history-quick">Quick Range</Label>
            <div className="flex h-8 overflow-hidden rounded-lg border" role="group" aria-labelledby="history-quick">
              {QUICK.map((q) => (
                <Button
                  key={q.label}
                  type="button"
                  variant={Math.abs(span - q.ms) < 1000 ? 'default' : 'ghost'}
                  className="h-full rounded-none"
                  onClick={() => quick(q.ms)}
                >
                  {q.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="history-from">From</Label>
            <DateTimePicker id="history-from" value={value.from} onChange={(from) => onChange({ ...value, from })} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="history-to">To</Label>
            <DateTimePicker id="history-to" value={value.to} onChange={(to) => onChange({ ...value, to })} />
          </div>
        </div>

        <fieldset className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <legend className="sr-only">Parameters</legend>
          <span className="text-sm font-medium" aria-hidden>
            Parameters
          </span>
          {PARAMS.map((p) => (
            <label key={p.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={value.params[p.key]}
                onChange={(e) => onChange({ ...value, params: { ...value.params, [p.key]: e.target.checked } })}
              />
              {p.label}
            </label>
          ))}
        </fieldset>
      </CardContent>
      <CardFooter className="flex-wrap justify-between gap-3">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="size-4 shrink-0" aria-hidden />
          Historical data is kept for the last 10 days. New readings appear here up to 15 minutes after they are
          received.
        </p>
        <div className="flex items-center gap-3">
          {problem && (
            <span role="alert" className="text-xs text-destructive">
              {problem}
            </span>
          )}
          <Button type="button" onClick={onApply} disabled={problem !== null || value.machineId === ''}>
            Apply Filters
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
