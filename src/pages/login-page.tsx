import { Navigate, useLocation } from 'react-router-dom'
import { LoginForm } from '@/features/auth/components/login-form'
import { useAuthStore } from '@/features/auth/store'

export function LoginPage() {
  const signedIn = useAuthStore((s) => s.session !== null)
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/monitoring'

  if (signedIn) return <Navigate to={from} replace />
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <LoginForm />
    </main>
  )
}
