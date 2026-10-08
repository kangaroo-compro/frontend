import { useEffect, useRef, useState } from 'react'
import { recoverSession } from '@/features/auth/session'
import { useAuthStore } from '@/features/auth/store'
import { wsUrl } from '@/lib/api'
import type { Sample, SystemSnapshot } from '../types'

/** One sample every 2 s on the server. */
export const SAMPLE_INTERVAL_MS = 2000
/** 3 minutes of history. */
export const MAX_SAMPLES = 90

export type ConnectionState = 'connecting' | 'live' | 'reconnecting'

type Frame = { status: 'success'; message: string; data: unknown } | { status: 'error'; message: string }

/**
 * Streams VPS and Manager metrics from the Manager WebSocket. Authenticates
 * with the first message, sends refreshed tokens on the open socket, recovers
 * once from a rejected token, and reconnects with backoff (1 s doubling to 30 s).
 */
export function useSystemMetrics() {
  const token = useAuthStore((s) => s.session?.accessToken ?? null)
  const signedIn = token !== null
  const [state, setState] = useState<ConnectionState>('connecting')
  const [samples, setSamples] = useState<Sample[]>([])
  const socket = useRef<WebSocket | null>(null)

  // A refreshed token is sent on the open socket instead of reconnecting.
  useEffect(() => {
    const ws = socket.current
    if (token && ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'auth', token }))
    }
  }, [token])

  useEffect(() => {
    if (!signedIn) return
    let stopped = false
    let attempt = 0
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    const connect = () => {
      const ws = new WebSocket(wsUrl('/ws'))
      socket.current = ws
      let sentToken = ''
      let subscribed = false

      ws.onopen = () => {
        sentToken = useAuthStore.getState().session?.accessToken ?? ''
        ws.send(JSON.stringify({ type: 'auth', token: sentToken }))
      }
      ws.onmessage = (event) => {
        const frame = JSON.parse(event.data as string) as Frame
        if (frame.status === 'error') return // the close code that may follow decides what to do
        if (frame.message === 'Authenticated' && !subscribed) {
          subscribed = true
          attempt = 0
          setState('live')
          ws.send(JSON.stringify({ type: 'subscribe', devices: [], system: true }))
        } else if (frame.message === 'System metrics') {
          const snapshot = frame.data as SystemSnapshot
          const sample = { snapshot, sampledAt: Date.parse(snapshot.time), receivedAt: Date.now() }
          setSamples((prev) => [...prev, sample].slice(-MAX_SAMPLES))
        }
      }
      ws.onclose = (event) => {
        socket.current = null
        if (stopped) return
        setState('reconnecting')
        // 1008 + auth reason: refresh once and reconnect; recoverSession signs out otherwise.
        if (event.code === 1008 && (event.reason === 'Unauthorized' || event.reason === 'Token expired')) {
          void recoverSession(sentToken).then((ok) => ok && !stopped && connect())
          return
        }
        attempt++
        retryTimer = setTimeout(connect, Math.min(30_000, 1000 * 2 ** (attempt - 1)))
      }
    }

    connect()
    return () => {
      stopped = true
      clearTimeout(retryTimer)
      socket.current?.close()
    }
  }, [signedIn])

  return { state, samples }
}
