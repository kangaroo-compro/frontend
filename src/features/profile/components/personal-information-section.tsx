import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { User } from '@/features/users/types'
import { errorMessage } from '@/lib/api'
import { updateMe } from '../api'
import { ProfileSection } from './profile-section'

/** Name is editable; email and role are shown read-only. A saved name refreshes the ['me'] pill. */
export function PersonalInformationSection({ user }: { user: User }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(user.name)

  const save = useMutation({
    mutationFn: () => updateMe(name.trim()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    save.mutate()
  }

  return (
    <ProfileSection title="Personal information" description="Your name is shown across the dashboard." onSubmit={onSubmit}>
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
        <Input id="profile-email" value={user.email} disabled readOnly />
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
        <Button type="submit" disabled={save.isPending || name.trim() === user.name}>
          {save.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </ProfileSection>
  )
}
