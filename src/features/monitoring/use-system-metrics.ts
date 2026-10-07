import { useEffect, useRef, useState } from 'react'
import type { Sample, SystemSnapshot } from './types'

/** 3 minutes of history at one sample every 2 s. */
export const MAX_SAMPLES = 90

export type ConnectionState = 'connecting' | 'live' | 'reconnecting' | 'unauthorized'

type Frame =
  | { status: 'success'; message: 'System metrics'; data: SystemSnapshot }
  | { status: 'success'; message: string; data: unknown }
  | { status: 'error'; message: string }

/** wss://host/ws from VITE_API_URL (http -> ws, https -> wss). */
function wsUrl(): string {
  return `${import.meta.env.VITE_API_URL.replace(/^http/, 'ws').replace(/\/$/, '')}/ws`
}

/**
 * Streams VPS and Manager metrics from the Manager WebSocket.
 * Authenticates with the first message, re-authenticates when the token is
 * refreshed, and reconnects with backoff (1 s doubling to 30 s).
 */
export function useSystemMetrics(token: string | null) {
  const [state, setState] = useState<ConnectionState>('connecting')
  const [samples, setSamples] = useState<Sample[]>([])
  const socket = useRef<WebSocket | null>(null)
  const currentToken = useRef(token)
  const hasToken = token !== null

  // A refreshed token is sent on the open socket instead of reconnecting.
  useEffect(() => {
    currentToken.current = token
    const ws = socket.current
    if (token && ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'auth', token }))
    }
  }, [token])

  useEffect(() => {
    if (!hasToken) return
    let stopped = false
    let attempt = 0
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    const connect = () => {
      const ws = new WebSocket(wsUrl())
      socket.current = ws
      let subscribed = false

      ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', token: currentToken.current }))
      ws.onmessage = (event) => {
        const frame = JSON.parse(event.data as string) as Frame
        if (frame.status === 'error') return // the close code that follows decides what to do
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
        // 1008 with an auth reason: the token is not accepted, so retrying is pointless.
        if (event.code === 1008 && (event.reason === 'Unauthorized' || event.reason === 'Token expired')) {
          setState('unauthorized')
          return
        }
        attempt++
        setState('reconnecting')
        retryTimer = setTimeout(connect, Math.min(30_000, 1000 * 2 ** (attempt - 1)))
      }
    }

    connect()
    return () => {
      stopped = true
      clearTimeout(retryTimer)
      socket.current?.close()
    }
  }, [hasToken])

  return { state, samples }
}
