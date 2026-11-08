import type { Readings } from '@/features/telemetry/types'

export type CompressorSample = {
  t: number
  temperature: number
  voltage: number
  ampere: number
  status: 'ON' | 'OFF'
}

export type ConnectionState = 'connecting' | 'live' | 'reconnecting' | 'offline'

/** The newest reading of one machine and when the Manager received it (epoch ms). */
export type LatestReading = { readings: Readings; at: number }
