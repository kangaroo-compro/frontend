import { useState, type FormEvent } from 'react'
import { LoaderCircle, Lock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { errorMessage } from '@/lib/api'
import logo from '@/assets/logo.png'
import logoWhite from '@/assets/logo-white.webp'
import { login } from '../api'
import { useAuthStore } from '../store'

export function LoginForm() {
  const notice = useAuthStore((s) => s.notice)
  const setSession = useAuthStore((s) => s.setSession)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      setSession(await login(email, password))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="p-2.5 rounded-xl bg-white dark:bg-card shadow-xs border border-border/50 inline-flex items-center justify-center mb-3">
          <img
            src={logo}
            alt="Perum Peruri"
            className="dark:hidden h-12 w-auto max-w-[160px] object-contain"
          />
          <img
            src={logoWhite}
            alt="Perum Peruri"
            className="hidden dark:block h-12 w-auto max-w-[160px] object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Masuk ke Akun
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sistem Telemetry Monitoring
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden />
            <Input
              id="email"
              type="email"
              autoComplete="username"
              required
              placeholder="nama@peruri.co.id"
              className="pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Kata Sandi
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="pl-9"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div role="alert" className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive font-medium">
            {error}
          </div>
        )}

        {notice && (
          <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground text-center">
            {notice}
          </div>
        )}

        <Button type="submit" disabled={pending} className="w-full mt-2 h-10 font-semibold shadow-xs">
          {pending ? (
            <>
              <LoaderCircle className="size-4 animate-spin mr-2" aria-hidden /> Masuk...
            </>
          ) : (
            'Masuk'
          )}
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-border/40 text-center">
        <p className="text-xs text-muted-foreground">
          &copy; 2026 Perum Peruri &middot; Seluruh hak cipta dilindungi.
        </p>
      </div>
    </div>
  )
}
