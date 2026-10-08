import { logout, refreshSession } from './api'
import { useAuthStore } from './store'

export const SESSION_ENDED = 'Your session ended. Sign in again.'

/** Refreshes the session now; a failure signs out. */
export async function refreshNow(): Promise<boolean> {
  const { session, setSession, signOut } = useAuthStore.getState()
  if (!session) return false
  try {
    setSession(await refreshSession(session.refreshToken))
    return true
  } catch {
    signOut(SESSION_ENDED)
    return false
  }
}

const retried = new Set<string>()

/**
 * Called when the server rejects an access token (e.g. it expired while the
 * laptop slept). Refreshes once per rejected token; true means a usable token
 * is in the store, false means the user was signed out.
 */
export async function recoverSession(rejectedToken: string): Promise<boolean> {
  const { session, signOut } = useAuthStore.getState()
  if (!session) return false
  if (session.accessToken !== rejectedToken) return true // already refreshed
  if (retried.has(rejectedToken)) {
    signOut(SESSION_ENDED)
    return false
  }
  retried.add(rejectedToken)
  return refreshNow()
}

/** Revokes the refresh token on the server (best effort) and clears the session. */
export function signOutEverywhere() {
  const { session, signOut } = useAuthStore.getState()
  if (session) logout(session.refreshToken).catch(() => {})
  signOut()
}
