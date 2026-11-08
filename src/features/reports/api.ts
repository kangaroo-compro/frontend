import { api, type Envelope } from '@/lib/api'
import type { PageMeta, Report, ReportInput } from './types'

export async function listReports(
  limit: number,
  offset: number,
  search?: string,
): Promise<{ reports: Report[]; meta: PageMeta }> {
  const { data } = await api.get<Envelope<Report[]> & { meta: PageMeta }>('/reports', {
    params: { limit, offset, search: search || undefined },
  })
  return { reports: data.data, meta: data.meta }
}

export async function createReport(input: ReportInput): Promise<Report> {
  const { data } = await api.post<Envelope<Report>>('/reports', input)
  return data.data
}

/** A temporary URL for a ready report; opening it downloads the stored file. */
export async function reportDownloadUrl(id: string): Promise<string> {
  const { data } = await api.get<Envelope<{ url: string; expires_in: number }>>(`/reports/${id}/download`)
  return data.data.url
}
