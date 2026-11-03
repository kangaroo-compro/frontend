import { api, type Envelope } from '@/lib/api'
import type { User, UserListResponse } from './types'

export async function listUsers(
  limit = 10,
  offset = 0,
): Promise<UserListResponse> {
  const { data } = await api.get<Envelope<User[]> & {
    meta: UserListResponse['meta']
  }>('/users', {
    params: { limit, offset },
  })

  return {
    data: data.data,
    meta: data.meta,
  }
}