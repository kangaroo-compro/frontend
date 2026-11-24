import { format } from 'date-fns'
import { condition } from '@/features/machines/condition'
import type { Machine } from '@/features/machines/types'
import { parseReadings } from '@/features/telemetry/api'
import type { TelemetryRow } from '@/features/telemetry/types'
import type { Params } from './components/history-filters'

/** One CSV field. Text that a spreadsheet could run as a formula gets a leading quote; quotes and commas are escaped. */
function cell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return ''
  const text = typeof value === 'number' ? String(value) : value.replace(/^[=+\-@\t\r]/, "'$&")
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Formats telemetry history rows as CSV respecting active parameters and machine thresholds. */
export function telemetryToCsv(
  machine: Machine,
  rows: TelemetryRow[],
  params: Params,
): string {
  const header: string[] = ['Time', 'Machine', 'Device ID']
  if (params.status) header.push('Status')
  if (params.temperature) header.push('Temperature (°C)')
  if (params.pressure) header.push('Pressure (mbar)')
  if (params.runningHours) header.push('Running hours (h)')
  header.push('Condition')

  const csvRows = rows.map((r) => {
    const p = parseReadings(r.payload)
    const cond = condition(p, machine.thresholds)
    const row: (string | number | undefined | null)[] = [
      format(new Date(r.recorded_at), "yyyy-MM-dd'T'HH:mm:ssxxx"),
      machine.name,
      r.device_id,
    ]
    if (params.status) row.push(p.status)
    if (params.temperature) row.push(p.temperature)
    if (params.pressure) row.push(p.pressure)
    if (params.runningHours) row.push(p.runningHours)
    row.push(cond)
    return row
  })

  // The BOM lets Excel read the UTF-8 file properly.
  return '\uFEFF' + [header, ...csvRows].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n'
}

/** Saves text as a file through the browser. */
export function downloadCsv(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
