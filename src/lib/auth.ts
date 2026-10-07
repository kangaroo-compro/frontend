import axios from 'axios'
import { api } from '@/lib/api'
import type { Session } from '@/stores/auth-store'

/** Every Manager response: {status, message, data} on success, {status, message} on error. */
export type Envelope<T> = { status: 'success'; message: string; data: T }
export type ErrorEnvelope = { status: 'error'; message: string }

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

/** The Manager's message for alerts, or a generic one when the request never got an answer. */
export function errorMessage(err: unknown): string {
  if (axios.isAxiosError<ErrorEnvelope>(err)) {
    return err.response?.data?.message ?? 'Cannot reach the server'
  }
  return 'Something went wrong'
}
