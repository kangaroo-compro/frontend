import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { recoverSession } from '@/features/auth/session'
import { useAuthStore } from '@/features/auth/store'

const EVENTS_URL = `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/reports/events`

/** Calls onReport for every "report" event in a Server-Sent Events body, until it ends. */
async function readEvents(body: ReadableStream<Uint8Array>, onReport: () => void) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) return
    buffer += decoder.decode(value, { stream: true })
    const blocks = buffer.split(/\r?\n\r?\n/)
    buffer = blocks.pop() ?? ''
    for (const block of blocks) {
      if (block.split(/\r?\n/).includes('event: report')) onReport()
    }
  }
}

/**
 * Refreshes the report list when the Manager announces a finished report.
 * EventSource cannot send an Authorization header, so the stream is read with fetch.
 * The Manager ends the stream when the access token expires; this reconnects with the current one.
 */
export function useReportEvents() {
  const queryClient = useQueryClient()
  const signedIn = useAuthStore((s) => s.session !== null)

  useEffect(() => {
    if (!signedIn) return
    const abort = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    let attempt = 0
    const refresh = () => void queryClient.invalidateQueries({ queryKey: ['reports'] })

    async function connect() {
      const token = useAuthStore.getState().session?.accessToken ?? ''
      try {
        const res = await fetch(EVENTS_URL, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
          signal: abort.signal,
        })
        if (res.status === 401) {
          await recoverSession(token)
        } else if (res.ok && res.body) {
          attempt = 0
          refresh() // events sent while disconnected are not replayed
          await readEvents(res.body, refresh)
        }
      } catch {
        // network error or abort: retry below unless aborted
      }
      if (!abort.signal.aborted) {
        attempt++
        timer = setTimeout(connect, Math.min(30_000, 1000 * 2 ** (attempt - 1)))
      }
    }

    void connect()
    return () => {
      abort.abort()
      clearTimeout(timer)
    }
  }, [signedIn, queryClient])
}
