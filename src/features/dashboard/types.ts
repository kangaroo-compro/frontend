import type { MachineStatus, Readings } from '@/features/telemetry/types'

/** One reading of the machine on screen; a value the payload lacked is undefined. */
export type CompressorSample = {
  t: number
  temperature?: number
  pressure?: number
  runningHours?: number
  status?: MachineStatus
}

export type ConnectionState = 'connecting' | 'live' | 'reconnecting' | 'offline'

/** The newest reading of one machine and when the Manager received it (epoch ms). */
export type LatestReading = { readings: Readings; at: number }
