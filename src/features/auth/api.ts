import { api, type Envelope } from '@/lib/api'
import type { Session } from './store'

type SessionResponse = {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  refresh_token: string
  refresh_expires_in: number
}

function toSession(r: SessionResponse): Session {
  const now = Date.now()
  return {
    accessToken: r.access_token,
    refreshToken: r.refresh_token,
    accessExpiresAt: now + r.expires_in * 1000,
    refreshExpiresAt: now + r.refresh_expires_in * 1000,
  }
}

export async function login(email: string, password: string): Promise<Session> {
  const { data } = await api.post<Envelope<SessionResponse>>('/auth/login', { email, password })
  return toSession(data.data)
}

const refreshing = new Map<string, Promise<Session>>()

/**
 * Refresh tokens are single use, and the Manager treats a second use as theft
 * (it ends every session). Concurrent callers with the same token therefore
 * share one request.
 */
export function refreshSession(refreshToken: string): Promise<Session> {
  let pending = refreshing.get(refreshToken)
  if (!pending) {
    pending = api
      .post<Envelope<SessionResponse>>('/auth/refresh', { refresh_token: refreshToken })
      .then(({ data }) => toSession(data.data))
      .finally(() => refreshing.delete(refreshToken))
    refreshing.set(refreshToken, pending)
  }
  return pending
}

export async function logout(refreshToken: string): Promise<void> {
  await api.post('/auth/logout', { refresh_token: refreshToken })
}
