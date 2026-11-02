import axios from 'axios'
import { useAuthStore } from '@/features/auth/store'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10_000,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().session?.accessToken
  if (token && !config.url?.startsWith('/auth/')) config.headers.Authorization = `Bearer ${token}`
  return config
})

// A 401 on a request we signed means the access token was rejected: refresh, then replay once
// on plain axios (no interceptors, so a second 401 just surfaces).
api.interceptors.response.use(undefined, async (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401 && error.config) {
    const config = error.config
    const sent = String(config.headers.Authorization ?? '')
    if (sent.startsWith('Bearer ')) {
      const { recoverSession } = await import('@/features/auth/session')
      const fresh = (await recoverSession(sent.slice('Bearer '.length)))
        ? useAuthStore.getState().session?.accessToken
        : undefined
      if (fresh) {
        config.headers.Authorization = `Bearer ${fresh}`
        return axios.request(config)
      }
    }
  }
  throw error
})

/** Every Manager response: {status, message, data} on success, {status, message} on error. */
export type Envelope<T> = { status: 'success'; message: string; data: T }
export type ErrorEnvelope = { status: 'error'; message: string }

/** The Manager's message for alerts, or a generic one when no answer came back. */
export function errorMessage(err: unknown): string {
  if (axios.isAxiosError<ErrorEnvelope>(err)) {
    return err.response?.data?.message ?? 'Cannot reach the server'
  }
  return 'Something went wrong'
}

/** wss://host/path from VITE_API_URL (http -> ws, https -> wss). */
export function wsUrl(path: string): string {
  return `${import.meta.env.VITE_API_URL.replace(/^http/, 'ws').replace(/\/$/, '')}${path}`
}
