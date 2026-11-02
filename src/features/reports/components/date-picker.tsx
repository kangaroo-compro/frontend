import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type Props = {
  id: string
  value: Date
  onChange: (next: Date) => void
}

/** shadcn date picker with a time field: a button that opens a calendar and an HH:mm input. */
export function DateTimePicker({ id, value, onChange }: Props) {
  const [today] = useState(() => new Date())

  function pickDay(day: Date | undefined) {
    if (!day) return
    const next = new Date(day)
    next.setHours(value.getHours(), value.getMinutes(), 0, 0)
    onChange(next)
  }

  function pickTime(text: string) {
    const [h = NaN, m = NaN] = text.split(':').map(Number)
    if (Number.isNaN(h) || Number.isNaN(m)) return
    const next = new Date(value)
    next.setHours(h, m, 0, 0)
    onChange(next)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" className="w-full justify-between font-normal">
          {format(value, 'd MMM yyyy, HH:mm')}
          <CalendarIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          defaultMonth={value}
          disabled={{ after: today }}
          onSelect={pickDay}
        />
        <div className="flex items-center gap-3 border-t p-3">
          <Label htmlFor={`${id}-time`}>Time</Label>
          <Input
            id={`${id}-time`}
            type="time"
            step={60}
            value={format(value, 'HH:mm')}
            onChange={(e) => pickTime(e.target.value)}
            className="w-28"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
