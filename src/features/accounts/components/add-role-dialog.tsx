import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { errorMessage } from '@/lib/api'
import { createRole } from '../api'
import type { Role } from '../types'

type Props = {
  onCreated: (role: Role) => void
  onClose: () => void
}

export function AddRoleDialog({ onCreated, onClose }: Props) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')

  const create = useMutation({
    mutationFn: () => createRole({ name, access: [] }),
    onSuccess: async (role) => {
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      onCreated(role)
      onClose()
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    create.mutate()
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Role</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-role-name">Role name</Label>
            <Input
              id="new-role-name"
              required
              maxLength={50}
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {create.isError && (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage(create.error)}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={create.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
