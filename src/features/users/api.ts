import { api, type Envelope } from '@/lib/api'
import type { CreateUserInput, UpdateUserPatch, User, UserListResponse } from './types'

export async function listUsers(
  limit = 10,
  offset = 0,
  search?: string,
): Promise<UserListResponse> {
  const { data } = await api.get<Envelope<User[]> & {
    meta: UserListResponse['meta']
  }>('/users', {
    params: { limit, offset, search: search || undefined },
  })

  return {
    data: data.data,
    meta: data.meta,
  }
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const { data } = await api.post<Envelope<User>>('/users', input)
  return data.data
}

export async function updateUser(id: string, patch: UpdateUserPatch): Promise<User> {
  const { data } = await api.patch<Envelope<User>>(`/users/${id}`, patch)
  return data.data
}

export async function updateUserStatus(id: string, status: number): Promise<User> {
  const { data } = await api.patch<Envelope<User>>(`/users/${id}/status`, { status })
  return data.data
}

export async function toggleUserStatus(id: string): Promise<User> {
  const { data } = await api.post<Envelope<User>>(`/users/${id}/toggle-status`)
  return data.data
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`)
}
