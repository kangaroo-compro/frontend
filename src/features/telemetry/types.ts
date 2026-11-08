export type MachineStatus = 'ON' | 'OFF'

/** What one machine telemetry payload carries (MQTT.md 3.3). A missing or wrongly typed value is undefined. */
export type Readings = {
  temperature?: number
  pressure?: number
  runningHours?: number
  status?: MachineStatus
}

export type TelemetryRow = {
  device_id: string
  recorded_at: string
  payload: unknown
}

export type Stat = { min: number | null; max: number | null; avg: number | null }

export type TelemetrySummary = {
  device_id: string
  count: number
  temperature: Stat
  pressure: Stat
}

/** One chart bucket from `/telemetry/series`; a value the bucket lacks is null. */
export type SeriesPoint = {
  t: string
  temperature: number | null
  pressure: number | null
  running_hours: number | null
  status: MachineStatus | null
}

export type EnergyRow = {
  meter_id: string
  recorded_at: string
  payload: unknown
}

/** Panel energy values (MQTT.md 3.2). */
export type EnergyReadings = {
  voltage?: number
  current?: number
  power?: number
  energy?: number
  powerFactor?: number
  frequency?: number
}

export type CommandName = 'ON' | 'OFF'

/** data of a "Command acknowledged" frame. `reason` is null when the HMI sent "". */
export type CommandAck = {
  device_id: string
  cmd_id: string
  result: 'ACCEPTED' | 'EXECUTED' | 'REJECTED' | 'FAILED'
  reason: string | null
  machine_status: string
  ts: string
  recorded_at: string
}

export type GatewayStatus = {
  gateway_id: string
  state: 'online' | 'offline'
  recorded_at: string
}
