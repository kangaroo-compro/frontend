import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { User } from '@/features/users/types'
import { errorMessage } from '@/lib/api'
import { updateMe } from '../api'

/** Changes the user's own name; the profile pill follows through the ['me'] query. */
export function EditProfileCard({ user }: { user: User }) {
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold tracking-tight">Edit profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form id="edit-profile-form" onSubmit={onSubmit} className="flex max-w-md flex-col gap-2">
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
          {save.isError && (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage(save.error)}
            </p>
          )}
          {save.isSuccess && (
            <p role="status" className="text-sm text-muted-foreground">
              Profile updated.
            </p>
          )}
        </form>
      </CardContent>
      <CardFooter className="justify-end">
        <Button type="submit" form="edit-profile-form" disabled={save.isPending || name.trim() === user.name}>
          {save.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </CardFooter>
    </Card>
  )
}
