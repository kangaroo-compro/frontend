import { api, type Envelope } from '@/lib/api'
import type { Machine, MachineInput, PageMeta } from './types'

export async function listMachines(
  limit: number,
  offset: number,
  search?: string,
): Promise<{ machines: Machine[]; meta: PageMeta }> {
  const { data } = await api.get<Envelope<Machine[]> & { meta: PageMeta }>('/machines', {
    params: { limit, offset, search: search || undefined },
  })
  return { machines: data.data, meta: data.meta }
}

export async function getMachine(id: string): Promise<Machine> {
  const { data } = await api.get<Envelope<Machine>>(`/machines/${id}`)
  return data.data
}

export async function createMachine(input: MachineInput): Promise<Machine> {
  const { data } = await api.post<Envelope<Machine>>('/machines', input)
  return data.data
}

export async function updateMachine(id: string, patch: Partial<MachineInput>): Promise<Machine> {
  const { data } = await api.patch<Envelope<Machine>>(`/machines/${id}`, patch)
  return data.data
}

export async function deleteMachine(id: string): Promise<void> {
  await api.delete(`/machines/${id}`)
}
