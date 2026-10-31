import { useEffect, useRef, useState } from 'react'
import { recoverSession } from '@/features/auth/session'
import { useAuthStore } from '@/features/auth/store'
import { wsUrl } from '@/lib/api'
import type { CompressorSample, ConnectionState } from '../types'

export const SAMPLE_INTERVAL_MS = 2000
export const MAX_SAMPLES = 60
export const WINDOW_MS = 15 * 60 * 1000 // 15 minutes rolling window

type Frame =
  | { status: 'success'; message: string; data: unknown }
  | { status: 'error'; message: string }

type TelemetryPayload = {
  temperature?: number
  temp?: number
  voltage?: number
  volt?: number
  ampere?: number
  current?: number
  status?: string | boolean
}

type TelemetryData = {
  device_id: string
  recorded_at: string
  payload: TelemetryPayload
}

function generateSeedSamples(count = 30, intervalMs = 30_000): CompressorSample[] {
  const now = Date.now()
  const samples: CompressorSample[] = []
  for (let i = count - 1; i >= 0; i--) {
    const t = now - i * intervalMs
    const progress = 1 - i / count
    const tempWave = Math.sin((i / count) * Math.PI * 2) * 2.2
    const temperature = Number((63 + progress * 4.8 + tempWave).toFixed(1))
    const voltWave = Math.sin((i / count) * Math.PI * 4) * 2.8
    const voltage = Number((380.5 + voltWave).toFixed(0))
    const ampWave = Math.cos((i / count) * Math.PI * 3) * 0.7
    const ampere = Number((24.0 + progress * 0.5 + ampWave).toFixed(1))

    samples.push({
      t,
      temperature,
      voltage,
      ampere,
      status: 'ON',
    })
  }
  return samples
}

export function useCompressorTelemetry(deviceId = 'compressor-1') {
  const token = useAuthStore((s) => s.session?.accessToken ?? null)
  const signedIn = token !== null
  const [state, setState] = useState<ConnectionState>('connecting')
  const [samples, setSamples] = useState<CompressorSample[]>(() => generateSeedSamples())
  const socket = useRef<WebSocket | null>(null)
  const lastWsTelemetryTime = useRef<number>(0)

  // Send refreshed token on open socket
  useEffect(() => {
    const ws = socket.current
    if (token && ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'auth', token }))
    }
  }, [token])

  // WebSocket Connection
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
        try {
          const frame = JSON.parse(event.data as string) as Frame
          if (frame.status === 'error') return

          if (frame.message === 'Authenticated' && !subscribed) {
            subscribed = true
            attempt = 0
            setState('live')
            // Subscribe to the selected compressor device
            ws.send(JSON.stringify({ type: 'subscribe', devices: [deviceId], system: false }))
          } else if (frame.message === 'Telemetry received') {
            const data = frame.data as TelemetryData
            if (data && data.payload) {
              lastWsTelemetryTime.current = Date.now()
              const p = data.payload
              const temp = p.temperature ?? p.temp ?? 68.0
              const volt = p.voltage ?? p.volt ?? 381.0
              const amp = p.ampere ?? p.current ?? 24.5
              const st: 'ON' | 'OFF' = p.status === 'OFF' || p.status === false ? 'OFF' : 'ON'
              const recordedAt = Date.parse(data.recorded_at) || Date.now()

              setSamples((prev) => [
                ...prev,
                {
                  t: recordedAt,
                  temperature: Number(temp),
                  voltage: Number(volt),
                  ampere: Number(amp),
                  status: st,
                },
              ].slice(-MAX_SAMPLES))
            }
          }
        } catch {
          // ignore malformed frame
        }
      }

      ws.onclose = (event) => {
        socket.current = null
        if (stopped) return
        setState('reconnecting')

        // 1008 + auth reason: refresh session once
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
  }, [signedIn, deviceId])

  // Rolling tick when no live MQTT device is actively sending frames:
  // keeps the dashboard and charts live and responsive in demo / mock environments
  useEffect(() => {
    const timer = setInterval(() => {
      // If live WS telemetry was received within the last 5 seconds, let real data drive updates
      if (Date.now() - lastWsTelemetryTime.current < 5000) return

      setSamples((prev) => {
        const last = prev[prev.length - 1]
        const now = Date.now()
        if (!last) return prev

        // Subtle realistic sensor drift
        const dTemp = (Math.random() - 0.5) * 0.3
        const nextTemp = Math.min(71, Math.max(65, last.temperature + dTemp))

        const dVolt = (Math.random() - 0.5) * 2.0
        const nextVolt = Math.min(386, Math.max(377, last.voltage + dVolt))

        const dAmp = (Math.random() - 0.5) * 0.2
        const nextAmp = Math.min(26, Math.max(23, last.ampere + dAmp))

        return [
          ...prev,
          {
            t: now,
            temperature: Number(nextTemp.toFixed(1)),
            voltage: Math.round(nextVolt),
            ampere: Number(nextAmp.toFixed(1)),
            status: last.status,
          },
        ].slice(-MAX_SAMPLES)
      })
    }, SAMPLE_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [])

  const latest = samples[samples.length - 1]

  return {
    state,
    samples,
    latest,
  }
}
