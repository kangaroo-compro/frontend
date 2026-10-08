import { useEffect } from 'react'
import { refreshNow } from '../session'
import { useAuthStore } from '../store'

/** Refresh this long before the 15-minute access token expires. */
const REFRESH_LEAD_MS = 60_000

/** Keeps the access token fresh while mounted. */
export function useTokenRefresh() {
  const accessExpiresAt = useAuthStore((s) => s.session?.accessExpiresAt)

  useEffect(() => {
    if (accessExpiresAt === undefined) return
    const delay = Math.max(accessExpiresAt - Date.now() - REFRESH_LEAD_MS, 0)
    const timer = setTimeout(() => void refreshNow(), delay)
    return () => clearTimeout(timer)
  }, [accessExpiresAt])
}
