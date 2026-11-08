import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signOutEverywhere } from '@/features/auth/session'
import { errorMessage } from '@/lib/api'
import { changePassword } from '../api'

const MIN_LENGTH = 12
const MAX_LENGTH = 128

/** Why the new password cannot be sent, or null. The Manager checks the same 12-128 rule. */
function problemWith(next: string, confirm: string): string | null {
  const length = [...next].length
  if (length < MIN_LENGTH || length > MAX_LENGTH) return `The new password must be ${MIN_LENGTH}-${MAX_LENGTH} characters.`
  if (next !== confirm) return 'The new passwords do not match.'
  return null
}

export function ChangePasswordCard() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [checked, setChecked] = useState(false)

  // The Manager revokes every refresh token on success, so sign in again.
  const save = useMutation({
    mutationFn: () => changePassword(current, next),
    onSuccess: () => signOutEverywhere('Your password was changed. Sign in again.'),
  })

  const problem = problemWith(next, confirm)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setChecked(true)
    if (problem === null) save.mutate()
  }

  const field = (id: string, label: string, value: string, set: (v: string) => void, autoComplete: string) => (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="password"
        required
        maxLength={MAX_LENGTH}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => {
          set(e.target.value)
          save.reset()
        }}
      />
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold tracking-tight">Change password</CardTitle>
      </CardHeader>
      <CardContent>
        <form id="change-password-form" onSubmit={onSubmit} className="flex max-w-md flex-col gap-4">
          {field('current-password', 'Current password', current, setCurrent, 'current-password')}
          {field('new-password', 'New password', next, setNext, 'new-password')}
          {field('confirm-password', 'Confirm new password', confirm, setConfirm, 'new-password')}
          <p className="text-xs text-muted-foreground">
            {MIN_LENGTH}-{MAX_LENGTH} characters. You will be signed out everywhere and must sign in again.
          </p>
          {checked && problem && (
            <p role="alert" className="text-sm text-destructive">
              {problem}
            </p>
          )}
          {save.isError && (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage(save.error)}
            </p>
          )}
        </form>
      </CardContent>
      <CardFooter className="justify-end">
        <Button type="submit" form="change-password-form" disabled={save.isPending}>
          {save.isPending ? 'Changing…' : 'Change password'}
        </Button>
      </CardFooter>
    </Card>
  )
}
