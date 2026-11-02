import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RequireAuth } from '@/features/auth/components/require-auth'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { LoginPage } from '@/pages/login-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { MonitoringPage } from '@/pages/monitoring-page'
import { ReportNewPage } from '@/pages/report-new-page'
import { ReportPage } from '@/pages/report-page'
import { RolesPage } from '@/pages/roles-page'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/monitoring', element: <MonitoringPage /> },
          { path: '/history', element: <DashboardPage /> },
          { path: '/report', element: <ReportPage /> },
          { path: '/report/new', element: <ReportNewPage /> },
          { path: '/manage-machine', element: <DashboardPage /> },
          { path: '/profile', element: <DashboardPage /> },
          { path: '/role', element: <RolesPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
