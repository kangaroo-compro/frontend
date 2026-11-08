import { format } from 'date-fns'
import type { CompressorSample } from './types'

const HEADER = ['Time', 'Machine', 'Device ID', 'Status', 'Temperature (°C)', 'Pressure (mbar)', 'Running hours (h)']

/** One CSV field. Text that a spreadsheet could run as a formula gets a leading quote; quotes and commas are escaped. */
function cell(value: string | number | undefined): string {
  if (value === undefined) return ''
  const text = typeof value === 'number' ? String(value) : value.replace(/^[=+\-@\t\r]/, "'$&")
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** The samples on screen as CSV, oldest first. A reading the payload lacked is an empty cell. */
export function samplesToCsv(machine: { name: string; device_id: string }, samples: CompressorSample[]): string {
  const rows = samples.map((s) => [
    format(s.t, "yyyy-MM-dd'T'HH:mm:ssxxx"), // local time with its offset
    machine.name,
    machine.device_id,
    s.status,
    s.temperature,
    s.pressure,
    s.runningHours,
  ])
  // The BOM lets Excel read the degree sign as UTF-8.
  return '﻿' + [HEADER, ...rows].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n'
}

/** Saves text as a file through the browser; nothing is sent to the Manager. */
export function downloadCsv(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
