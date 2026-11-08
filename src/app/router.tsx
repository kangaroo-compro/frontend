import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RequireAuth } from '@/features/auth/components/require-auth'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { LoginPage } from '@/pages/login-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { HistoryPage } from '@/pages/history-page'
import { MachinesPage } from '@/pages/machines-page'
import { MonitoringPage } from '@/pages/monitoring-page'
import { ProfilePage } from '@/pages/profile-page'
import { ReportNewPage } from '@/pages/report-new-page'
import { ReportPage } from '@/pages/report-page'
import { RolesPage } from '@/pages/roles-page'
import { UsersPage } from '@/pages/users-page'

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
          { path: '/dashboard/:machineId', element: <DashboardPage /> },
          { path: '/monitoring', element: <MonitoringPage /> },
          { path: '/history', element: <HistoryPage /> },
          { path: '/report', element: <ReportPage /> },
          { path: '/report/new', element: <ReportNewPage /> },
          { path: '/manage-machine', element: <MachinesPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/role', element: <RolesPage /> },
          { path: '/users', element: <UsersPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
