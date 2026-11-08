import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signOutEverywhere } from '@/features/auth/session'
import type { User } from '@/features/users/types'
import { errorMessage } from '@/lib/api'
import { updateMe } from '../api'
import { ProfileSection } from './profile-section'

/**
 * Name and email are saved together. A saved name refreshes the ['me'] pill; a changed email makes the Manager
 * revoke every refresh token, so the user signs in again with the new address. Role is read-only.
 */
export function PersonalInformationSection({ user }: { user: User }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)

  // The Manager treats the same address in another case as unchanged, so do the same here.
  const nameChanged = name.trim() !== user.name
  const emailChanged = email.trim().toLowerCase() !== user.email

  const save = useMutation({
    mutationFn: (patch: { name?: string; email?: string }) => updateMe(patch),
    onSuccess: (_, patch) =>
      patch.email === undefined
        ? queryClient.invalidateQueries({ queryKey: ['me'] })
        : signOutEverywhere('Your email was changed. Sign in again with the new email.'),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    save.mutate({
      ...(nameChanged && { name: name.trim() }),
      ...(emailChanged && { email: email.trim() }),
    })
  }

  return (
    <ProfileSection title="Personal information" description="Your name and email are used to sign in and shown across the dashboard." onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-name">Name</Label>
        <Input
          id="profile-name"
          required
          maxLength={100}
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            save.reset()
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-email">Email</Label>
        <Input
          id="profile-email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            save.reset()
          }}
        />
        <p className="text-xs text-muted-foreground">Changing your email signs you out everywhere.</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-role">Role</Label>
        <Input id="profile-role" value={user.role_name} disabled readOnly />
      </div>
      <div className="flex items-center justify-end gap-3">
        {save.isError && (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage(save.error)}
          </p>
        )}
        {save.isSuccess && (
          <p role="status" className="text-sm text-muted-foreground">
            Saved
          </p>
        )}
        <Button type="submit" disabled={save.isPending || (!nameChanged && !emailChanged)}>
          {save.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </ProfileSection>
  )
}
