import { useEffect, useRef, useState } from 'react'
import type { ConnectionState } from '@/features/dashboard/types'
import { recoverSession } from '@/features/auth/session'
import { useAuthStore } from '@/features/auth/store'
import type { CommandAck, EnergyRow, GatewayStatus, TelemetryRow } from '@/features/telemetry/types'
import { wsUrl } from '@/lib/api'

type Frame = { status: 'success'; message: string; data: unknown } | { status: 'error'; message: string }

type Options = {
  /** Machine device IDs to follow, or '*' for all. */
  devices: string[] | '*'
  /** Also receive panel energy readings. */
  energy?: boolean
  onTelemetry?: (row: TelemetryRow) => void
  onAck?: (ack: CommandAck) => void
  onEnergy?: (row: EnergyRow) => void
  onGateway?: (status: GatewayStatus) => void
}

/**
 * One authenticated Manager WebSocket for the Dashboard pages. Frames are handed to the callbacks;
 * the callbacks are read through a ref, so changing them never reconnects. The subscription is sent after
 * every `Authenticated` and whenever `devices` or `energy` change.
 */
export function useManagerSocket({ devices, energy = false, ...callbacks }: Options): { state: ConnectionState } {
  const token = useAuthStore((s) => s.session?.accessToken ?? null)
  const signedIn = token !== null
  const [state, setState] = useState<ConnectionState>('connecting')
  const socket = useRef<WebSocket | null>(null)
  const authenticated = useRef(false)
  const handlers = useRef(callbacks)
  const wanted = useRef({ devices, energy })

  useEffect(() => {
    handlers.current = callbacks
  })

  const devicesKey = devices === '*' ? '*' : [...devices].sort().join(',')

  const sendSubscribe = () => {
    const ws = socket.current
    if (!ws || ws.readyState !== WebSocket.OPEN || !authenticated.current) return
    const { devices: d, energy: e } = wanted.current
    ws.send(JSON.stringify({ type: 'subscribe', devices: d === '*' ? ['*'] : d, system: false, energy: e }))
  }

  // Follow the wanted subscription.
  useEffect(() => {
    wanted.current = { devices, energy }
    sendSubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- devicesKey stands for devices
  }, [devicesKey, energy])

  // Send a refreshed token on the open socket; the subscription stays.
  useEffect(() => {
    const ws = socket.current
    if (token && ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'auth', token }))
  }, [token])

  useEffect(() => {
    if (!signedIn) return
    let stopped = false
    let attempt = 0
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    const connect = () => {
      const ws = new WebSocket(wsUrl('/ws'))
      socket.current = ws
      authenticated.current = false
      let sentToken = ''

      ws.onopen = () => {
        sentToken = useAuthStore.getState().session?.accessToken ?? ''
        ws.send(JSON.stringify({ type: 'auth', token: sentToken }))
      }

      ws.onmessage = (event) => {
        let frame: Frame
        try {
          frame = JSON.parse(event.data as string) as Frame
        } catch {
          return // malformed frame
        }
        if (frame.status === 'error') return
        const h = handlers.current
        switch (frame.message) {
          case 'Authenticated':
            attempt = 0
            authenticated.current = true
            setState('live')
            sendSubscribe()
            break
          case 'Telemetry received':
            h.onTelemetry?.(frame.data as TelemetryRow)
            break
          case 'Command acknowledged':
            h.onAck?.(frame.data as CommandAck)
            break
          case 'Energy received':
            h.onEnergy?.(frame.data as EnergyRow)
            break
          case 'Gateway status':
            h.onGateway?.(frame.data as GatewayStatus)
            break
        }
      }

      ws.onclose = (event) => {
        if (socket.current === ws) socket.current = null
        authenticated.current = false
        if (stopped) return
        setState('reconnecting')

        // 1008 + auth reason: refresh the session once, then connect again.
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

  return { state }
}
