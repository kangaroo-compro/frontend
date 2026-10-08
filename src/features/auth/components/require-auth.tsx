import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useTokenRefresh } from '../hooks/use-token-refresh'
import { useAuthStore } from '../store'

/** Layout route: signed-out users go to /login and come back afterwards. */
export function RequireAuth() {
  const signedIn = useAuthStore((s) => s.session !== null)
  const location = useLocation()
  useTokenRefresh()

  if (!signedIn) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
