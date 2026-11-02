import { api, type Envelope } from '@/lib/api'
import type { Role, RoleInput } from './types'

export async function listRoles(): Promise<Role[]> {
  const { data } = await api.get<Envelope<Role[]>>('/roles')
  return data.data
}

export async function createRole(input: RoleInput): Promise<Role> {
  const { data } = await api.post<Envelope<Role>>('/roles', input)
  return data.data
}

export async function updateRole(id: string, patch: Partial<RoleInput>): Promise<Role> {
  const { data } = await api.patch<Envelope<Role>>(`/roles/${id}`, patch)
  return data.data
}

export async function deleteRole(id: string): Promise<void> {
  await api.delete(`/roles/${id}`)
}
