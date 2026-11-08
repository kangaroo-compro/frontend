export type Range = { min: number; max: number }

export type Thresholds = { temperature: Range; pressure: Range }

export type DataPath = 'plc_gateway' | 'direct_iot'

export const DATA_PATH_LABELS: Record<DataPath, string> = {
  plc_gateway: 'PLC and Gateway',
  direct_iot: 'Direct IoT device',
}

export type Machine = {
  id: string
  name: string
  type: string
  data_path: DataPath
  device_id: string
  gateway_id: string
  cmd_enabled: boolean
  status: 'connected' | 'disconnected'
  thresholds: Thresholds
  created_at: string
  updated_at: string
}

/** The `POST /machines` body. */
export type MachineInput = {
  name: string
  type: string
  data_path: DataPath
  device_id: string
  gateway_id: string
  cmd_enabled: boolean
  thresholds: Thresholds
}

export type PageMeta = { limit: number; offset: number; total: number }
