import { Navigate, useLocation } from 'react-router-dom'
import { Image as ImageIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { LoginForm } from '@/features/auth/components/login-form'
import { useAuthStore } from '@/features/auth/store'

export function LoginPage() {
  const signedIn = useAuthStore((s) => s.session !== null)
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/dashboard'

  if (signedIn) return <Navigate to={from} replace />
  return (
    <main className="flex h-screen w-full flex-col md:flex-row items-stretch justify-center gap-6 p-4 md:p-6">
      {/* Left panel: wireframe ImageSquare */}
      <Card className="flex w-full md:w-1/2 h-full flex-col items-center justify-center p-6">
        <div className="flex flex-col items-start gap-4">
          <span className="text-sm font-medium text-muted-foreground">ImageSquare</span>
          <ImageIcon className="size-48 text-muted-foreground/40 stroke-[1.5]" aria-hidden />
        </div>
      </Card>

      {/* Right panel: wireframe Login form */}
      <Card className="flex w-full md:w-1/2 h-full flex-col justify-center p-6">
        <LoginForm />
      </Card>
    </main>
  )
}
