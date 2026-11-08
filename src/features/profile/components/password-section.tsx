import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signOutEverywhere } from '@/features/auth/session'
import { errorMessage } from '@/lib/api'
import { changePassword } from '../api'
import { ProfileSection } from './profile-section'

const MIN_LENGTH = 12
const MAX_LENGTH = 128

export function PasswordSection() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')

  // The Manager revokes every refresh token on success, so sign in again.
  const save = useMutation({
    mutationFn: () => changePassword(current, next),
    onSuccess: () => signOutEverywhere('Your password was changed. Sign in again.'),
  })

  const length = [...next].length
  const lengthError =
    next !== '' && (length < MIN_LENGTH || length > MAX_LENGTH) ? `Use ${MIN_LENGTH}–${MAX_LENGTH} characters.` : null
  const mismatchError = confirm !== '' && confirm !== next ? 'The passwords do not match.' : null
  const ready = current !== '' && next !== '' && confirm !== '' && !lengthError && !mismatchError

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (ready) save.mutate()
  }

  function field(id: string, label: string, value: string, set: (v: string) => void, autoComplete: string, below?: string | null, help?: string) {
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          type="password"
          required
          maxLength={MAX_LENGTH}
          autoComplete={autoComplete}
          aria-invalid={below ? true : undefined}
          value={value}
          onChange={(e) => {
            set(e.target.value)
            save.reset()
          }}
        />
        {below ? (
          <p role="alert" className="text-xs text-destructive">
            {below}
          </p>
        ) : (
          help && <p className="text-xs text-muted-foreground">{help}</p>
        )}
      </div>
    )
  }

  return (
    <ProfileSection
      title="Password"
      description="Changing your password signs you out everywhere."
      onSubmit={onSubmit}
    >
      {field('current-password', 'Current password', current, setCurrent, 'current-password')}
      {field('new-password', 'New password', next, setNext, 'new-password', lengthError, `${MIN_LENGTH}–${MAX_LENGTH} characters`)}
      {field('confirm-password', 'Confirm new password', confirm, setConfirm, 'new-password', mismatchError)}
      <div className="flex items-center justify-end gap-3">
        {save.isError && (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage(save.error)}
          </p>
        )}
        <Button type="submit" disabled={save.isPending || !ready}>
          {save.isPending ? 'Updating…' : 'Update password'}
        </Button>
      </div>
    </ProfileSection>
  )
}
