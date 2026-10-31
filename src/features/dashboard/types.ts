export type CompressorSample = {
  t: number
  temperature: number
  voltage: number
  ampere: number
  status: 'ON' | 'OFF'
}

export type ConnectionState = 'connecting' | 'live' | 'reconnecting' | 'offline'
