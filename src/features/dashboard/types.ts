import type { MachineStatus } from '@/features/telemetry/types'

/** One reading of the machine on screen; a value the payload lacked is undefined. */
export type CompressorSample = {
  t: number
  temperature?: number
  pressure?: number
  runningHours?: number
  status?: MachineStatus
}

export type ConnectionState = 'connecting' | 'live' | 'reconnecting' | 'offline'
