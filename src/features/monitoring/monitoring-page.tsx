import { useEffect, useRef, useState } from 'react'
import { CircleCheck, CircleX, LoaderCircle, LogOut, Table2, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logout, refreshSession } from '@/lib/auth'
import { useAuthStore, type Session } from '@/stores/auth-store'
import { formatBytes, formatClock, formatDuration, formatPercent, formatRate } from './format'
import { LineChart } from './line-chart'
import { LoginForm } from './login-form'
import { Meter } from './meter'
import { StatTile } from './stat-tile'
import { MAX_SAMPLES, useSystemMetrics, type ConnectionState } from './use-system-metrics'
import './monitoring.css'

const SAMPLE_INTERVAL_MS = 2000
const WINDOW_MS = MAX_SAMPLES * SAMPLE_INTERVAL_MS
/** Refresh this long before the 15-minute access token expires. */
const REFRESH_LEAD_MS = 60_000

const SESSION_ENDED = 'Your session ended. Sign in again.'

export function MonitoringPage() {
  const session = useAuthStore((s) => s.session)
  const setSession = useAuthStore((s) => s.setSession)
  const [notice, setNotice] = useState<string>()
  // Bumped to reconnect the dashboard with a new token after the socket rejected the old one.
  const [connection, setConnection] = useState(0)
  const retriedWith = useRef<string | null>(null)

  const signOut = (message?: string) => {
    setNotice(message)
    setSession(null)
  }

  // Keep the access token fresh; a failed refresh signs out.
  useEffect(() => {
    if (!session) return
    const delay = Math.max(session.accessExpiresAt - Date.now() - REFRESH_LEAD_MS, 0)
    const timer = setTimeout(() => {
      refreshSession(session.refreshToken)
        .then(setSession)
        .catch(() => {
          setNotice(SESSION_ENDED)
          setSession(null)
        })
    }, delay)
    return () => clearTimeout(timer)
  }, [session, setSession])

  // The socket rejected the token (expired, e.g. after the laptop slept): refresh
  // once and reconnect; a second rejection for the same token signs out.
  const onUnauthorized = (rejectedToken: string) => {
    const latest = useAuthStore.getState().session
    if (!latest) return
    if (latest.accessToken !== rejectedToken) {
      setConnection((n) => n + 1) // the timer already refreshed it
      return
    }
    if (retriedWith.current === rejectedToken) {
      signOut(SESSION_ENDED)
      return
    }
    retriedWith.current = rejectedToken
    refreshSession(latest.refreshToken)
      .then((next) => {
        setSession(next)
        setConnection((n) => n + 1)
      })
      .catch(() => signOut(SESSION_ENDED))
  }

  if (!session) return <LoginForm notice={notice} />
  return <Dashboard key={connection} session={session} onUnauthorized={onUnauthorized} onSignOut={() => signOut()} />
}

type DashboardProps = {
  session: Session
  onUnauthorized: (rejectedToken: string) => void
  onSignOut: () => void
}

function Dashboard({ session, onUnauthorized, onSignOut }: DashboardProps) {
  const { state, samples } = useSystemMetrics(session.accessToken)
  const [showTable, setShowTable] = useState(false)

  useEffect(() => {
    if (state === 'unauthorized') onUnauthorized(session.accessToken)
  }, [state, onUnauthorized, session.accessToken])

  const latest = samples.at(-1)
  const host = latest?.snapshot.host
  const manager = latest?.snapshot.manager
  const latencyMs = latest ? Math.max(latest.receivedAt - latest.sampledAt, 0) : undefined

  const signOut = () => {
    logout(session.refreshToken).catch(() => {}) // the session is dropped locally either way
    onSignOut()
  }

  return (
    <main className="viz-root mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--viz-ink)' }}>
            Monitoring
          </h1>
          <p className="text-sm" style={{ color: 'var(--viz-ink-secondary)' }}>
            VPS and Manager, live over WebSocket every 2 seconds
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionBadge state={state} />
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut aria-hidden /> Sign out
          </Button>
        </div>
      </header>

      {!latest ? (
        <div className="viz-card flex items-center justify-center gap-2 p-10 text-sm" style={{ color: 'var(--viz-ink-secondary)' }}>
          <LoaderCircle className="size-4 animate-spin" aria-hidden /> Waiting for the first sample…
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Current values">
            <StatTile label="CPU" value={formatPercent(host!.cpu_percent)} detail={`${host!.cpu_cores} cores`} />
            <StatTile label="Load average" value={host!.load[0].toFixed(2)} detail={`5 min ${host!.load[1].toFixed(2)} · 15 min ${host!.load[2].toFixed(2)}`} />
            <StatTile
              label="Update latency"
              value={`${latencyMs} ms`}
              detail="Manager sample → browser (clock skew included)"
            />
            <StatTile
              label="MQTT broker"
              value={<StatusValue ok={manager!.mqtt_connected} okLabel="Connected" badLabel="Disconnected" />}
              detail={`${manager!.telemetry_buffered} telemetry rows waiting to flush`}
            />
            <StatTile label="Network in" value={formatRate(manager!.net_rx_bytes_per_sec)} detail={`Out ${formatRate(manager!.net_tx_bytes_per_sec)}`} />
            <StatTile label="Dashboard connections" value={manager!.ws_clients} detail="Authenticated WebSockets" />
            <StatTile label="VPS uptime" value={formatDuration(host!.uptime_seconds)} detail={`Manager up ${formatDuration(manager!.uptime_seconds)}`} />
            <StatTile label="Go runtime" value={formatBytes(manager!.heap_bytes)} detail={`Heap · ${manager!.goroutines} goroutines`} />
          </section>

          <section className="grid gap-3 lg:grid-cols-2" aria-label="History">
            <LineChart
              title="CPU usage"
              subtitle={`All cores, last ${WINDOW_MS / 60_000} minutes`}
              points={samples.map((s) => ({ t: s.sampledAt, v: s.snapshot.host.cpu_percent }))}
              windowMs={WINDOW_MS}
              yMax={100}
              yTicks={[0, 50, 100]}
              format={(v) => `${Math.round(v)}%`}
            />
            <LineChart
              title="Memory used"
              subtitle={`Of ${formatBytes(host!.memory_total_bytes)} RAM, last ${WINDOW_MS / 60_000} minutes`}
              points={samples.map((s) => ({ t: s.sampledAt, v: s.snapshot.host.memory_used_bytes }))}
              windowMs={WINDOW_MS}
              yMax={host!.memory_total_bytes}
              yTicks={[0, host!.memory_total_bytes / 2, host!.memory_total_bytes]}
              format={formatBytes}
            />
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Capacity">
            <Meter label="VPS memory" used={host!.memory_used_bytes} total={host!.memory_total_bytes} />
            <Meter label="Swap" used={host!.swap_used_bytes} total={host!.swap_total_bytes} />
            <Meter label="Disk (/)" used={host!.disk_used_bytes} total={host!.disk_total_bytes} />
            <Meter label="Manager container memory" used={manager!.memory_bytes} total={manager!.memory_limit_bytes} />
          </section>

          <section className="flex flex-col gap-3">
            <div>
              <Button variant="outline" size="sm" onClick={() => setShowTable((v) => !v)} aria-expanded={showTable}>
                <Table2 aria-hidden /> {showTable ? 'Hide data table' : 'Show data table'}
              </Button>
            </div>
            {showTable && (
              <div className="viz-card overflow-x-auto">
                <table className="w-full text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <caption className="sr-only">Last 15 samples, newest first</caption>
                  <thead style={{ color: 'var(--viz-ink-secondary)' }}>
                    <tr className="text-left">
                      {['Time', 'CPU', 'Memory used', 'Swap used', 'Container memory', 'Latency'].map((h) => (
                        <th key={h} className="px-4 py-2 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody style={{ color: 'var(--viz-ink)' }}>
                    {samples
                      .slice(-15)
                      .reverse()
                      .map((s) => (
                        <tr key={s.sampledAt} className="border-t" style={{ borderColor: 'var(--viz-border)' }}>
                          <td className="px-4 py-2">{formatClock(s.sampledAt)}</td>
                          <td className="px-4 py-2">{formatPercent(s.snapshot.host.cpu_percent)}</td>
                          <td className="px-4 py-2">{formatBytes(s.snapshot.host.memory_used_bytes)}</td>
                          <td className="px-4 py-2">{formatBytes(s.snapshot.host.swap_used_bytes)}</td>
                          <td className="px-4 py-2">{formatBytes(s.snapshot.manager.memory_bytes)}</td>
                          <td className="px-4 py-2">{Math.max(s.receivedAt - s.sampledAt, 0)} ms</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}

function StatusValue({ ok, okLabel, badLabel }: { ok: boolean; okLabel: string; badLabel: string }) {
  const Icon = ok ? CircleCheck : CircleX
  return (
    <span className="flex items-center gap-2">
      <Icon className="size-5" style={{ color: ok ? 'var(--viz-good)' : 'var(--viz-critical)' }} aria-hidden />
      {ok ? okLabel : badLabel}
    </span>
  )
}

const badge: Record<ConnectionState, { label: string; icon: typeof Wifi; color: string; spin?: boolean }> = {
  live: { label: 'Live', icon: Wifi, color: 'var(--viz-good)' },
  connecting: { label: 'Connecting', icon: LoaderCircle, color: 'var(--viz-ink-muted)', spin: true },
  reconnecting: { label: 'Reconnecting', icon: WifiOff, color: 'var(--viz-warning)' },
  unauthorized: { label: 'Signed out', icon: CircleX, color: 'var(--viz-critical)' },
}

function ConnectionBadge({ state }: { state: ConnectionState }) {
  const { label, icon: Icon, color, spin } = badge[state]
  return (
    <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--viz-ink-secondary)' }} role="status">
      <Icon className={`size-4 ${spin ? 'animate-spin' : ''}`} style={{ color }} aria-hidden />
      {label}
    </span>
  )
}
