export type ReportType = 'machine_condition' | 'full_sensor_data'
export type ReportFormat = 'csv' | 'xlsx'
export type ReportStatus = 'pending' | 'ready' | 'failed'

export type Report = {
  id: string
  type: ReportType
  format: ReportFormat
  status: ReportStatus
  machines: { id: string; name: string; device_id: string }[]
  from: string
  to: string
  size_bytes: number
  error?: string
  created_by_id: string
  created_by_name: string
  created_at: string
  completed_at: string | null
}

export type ReportInput = {
  type: ReportType
  format: ReportFormat
  machine_ids: string[]
  from: string
  to: string
}

export type PageMeta = { limit: number; offset: number; total: number }
