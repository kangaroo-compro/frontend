import { api, type Envelope } from '@/lib/api'
import type { PageMeta } from '@/features/machines/types'
import type {
  CommandName,
  EnergyReadings,
  EnergyRow,
  Readings,
  SeriesPoint,
  TelemetryRow,
  TelemetrySummary,
} from './types'

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

function record(payload: unknown): Record<string, unknown> {
  return typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {}
}

/** Reads a machine telemetry payload; only numbers count, and status only when it is ON or OFF. */
export function parseReadings(payload: unknown): Readings {
  const p = record(payload)
  const status = typeof p.machine_status === 'string' ? p.machine_status.trim().toUpperCase() : ''
  return {
    temperature: num(p.temperature_c),
    pressure: num(p.pressure_mbar),
    runningHours: num(p.running_hours),
    status: status === 'ON' || status === 'OFF' ? status : undefined,
  }
}

/** Reads a panel energy payload; only numbers count. */
export function parseEnergy(payload: unknown): EnergyReadings {
  const p = record(payload)
  return {
    voltage: num(p.voltage_v),
    current: num(p.current_a),
    power: num(p.power_kw),
    energy: num(p.energy_kwh),
    powerFactor: num(p.power_factor),
    frequency: num(p.frequency_hz),
  }
}

/** The newest stored and buffered rows, newest first. */
export async function latestTelemetry(deviceId: string, limit: number): Promise<TelemetryRow[]> {
  const { data } = await api.get<Envelope<TelemetryRow[]>>(`/devices/${deviceId}/telemetry`, { params: { limit } })
  return data.data
}

/** Stored rows in [from, to], newest first, with the paging the Manager applied. */
export async function telemetryRange(
  deviceId: string,
  from: Date,
  to: Date,
  limit: number,
  offset: number,
): Promise<{ rows: TelemetryRow[]; meta: PageMeta }> {
  const { data } = await api.get<Envelope<TelemetryRow[]> & { meta: PageMeta }>(`/devices/${deviceId}/telemetry`, {
    params: { from: from.toISOString(), to: to.toISOString(), limit, offset },
  })
  return { rows: data.data, meta: data.meta }
}

export async function telemetrySummary(deviceId: string, from: Date, to: Date): Promise<TelemetrySummary> {
  const { data } = await api.get<Envelope<TelemetrySummary>>(`/devices/${deviceId}/telemetry/summary`, {
    params: { from: from.toISOString(), to: to.toISOString() },
  })
  return data.data
}

export async function telemetrySeries(deviceId: string, from: Date, to: Date, points: number): Promise<SeriesPoint[]> {
  const { data } = await api.get<Envelope<SeriesPoint[]>>(`/devices/${deviceId}/telemetry/series`, {
    params: { from: from.toISOString(), to: to.toISOString(), points },
  })
  return data.data
}

export async function latestEnergy(limit: number): Promise<EnergyRow[]> {
  const { data } = await api.get<Envelope<EnergyRow[]>>('/energy', { params: { limit } })
  return data.data
}

/** Publishes an ON/OFF command; resolves with its cmd_id. 202 means the broker took it, not that the machine acted. */
export async function sendCommand(deviceId: string, command: CommandName): Promise<string> {
  const { data } = await api.post<Envelope<{ cmd_id: string }>>(`/devices/${deviceId}/cmd`, { command })
  return data.data.cmd_id
}
