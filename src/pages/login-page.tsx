import { Navigate, useLocation } from 'react-router-dom'
import { ShieldCheck, Cpu, Activity } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { LoginForm } from '@/features/auth/components/login-form'
import { TelemetryHero } from '@/features/auth/components/telemetry-hero'
import { useAuthStore } from '@/features/auth/store'

export function LoginPage() {
  const signedIn = useAuthStore((s) => s.session !== null)
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/dashboard'

  if (signedIn) return <Navigate to={from} replace />

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-4 sm:p-6 md:p-8 lg:p-12">
      <div className="grid w-full max-w-6xl grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        {/* Left panel: Brand hero showcase */}
        <Card className="lg:col-span-7 hidden md:flex flex-col justify-between overflow-hidden border border-border/60 bg-gradient-to-br from-primary/5 via-background to-secondary/30 p-8 sm:p-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-6">
              <ShieldCheck className="size-3.5" />
              <span>Perum Peruri · Enterprise Machine Telemetry</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground lg:text-4xl leading-tight">
              Sistem Telemetry Monitoring
            </h2>
            <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-xl">
              Platform telemetri terintegrasi untuk pemantauan performa, getaran, suhu, dan parameter operasional mesin cetak berharga tinggi secara real-time.
            </p>
          </div>

          <div className="my-6 flex items-center justify-center">
            <TelemetryHero />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-border/40">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-primary shrink-0" />
              <span className="text-xs font-medium text-foreground">Real-time Sensor</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="size-4 text-primary shrink-0" />
              <span className="text-xs font-medium text-foreground">Monitoring Mesin</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary shrink-0" />
              <span className="text-xs font-medium text-foreground">Standar Peruri</span>
            </div>
          </div>
        </Card>

        {/* Right panel: Login form */}
        <Card className="lg:col-span-5 flex flex-col justify-center items-center border border-border/60 p-6 sm:p-10 bg-card shadow-xs">
          <LoginForm />
        </Card>
      </div>
    </main>
  )
}
