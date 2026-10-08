import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RequireAuth } from '@/features/auth/components/require-auth'
import { LoginPage } from '@/pages/login-page'
import { MonitoringPage } from '@/pages/monitoring-page'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [{ path: '/monitoring', element: <MonitoringPage /> }],
  },
  { path: '*', element: <Navigate to="/monitoring" replace /> },
])
