import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10_000,
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
