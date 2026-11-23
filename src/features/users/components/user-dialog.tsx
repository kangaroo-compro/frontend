import { useState, useEffect, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { listRoles } from '@/features/accounts/api'
import { errorMessage } from '@/lib/api'
import { createUser, updateUser } from '../api'
import type { User } from '../types'

type Props = {
  user?: User | null
  onClose: () => void
}

export function UserDialog({ user, onClose }: Props) {
  const isEdit = !!user
  const queryClient = useQueryClient()

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState(user?.role_id ?? '')
  const [status, setStatus] = useState<number>(user?.status ?? 1)

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: listRoles,
  })

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setRoleId(user.role_id)
      setStatus(user.status)
      setPassword('')
    }
  }, [user])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        return updateUser(user.id, {
          name,
          email,
          role_id: roleId,
          status,
          ...(password ? { password } : {}),
        })
      } else {
        return createUser({
          name,
          email,
          password,
          role_id: roleId,
          status,
        })
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      onClose()
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    saveMutation.mutate()
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit User' : 'Add User'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="user-name">Name</Label>
            <Input
              id="user-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@example.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="user-password">
              {isEdit ? 'Password (leave blank to keep current)' : 'Password'}
            </Label>
            <Input
              id="user-password"
              type="password"
              required={!isEdit}
              minLength={12}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? '••••••••••••' : 'Min. 12 characters'}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="user-role">Role</Label>
            <Select value={roleId} onValueChange={setRoleId} required>
              <SelectTrigger id="user-role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {rolesQuery.data?.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="user-status">Status</Label>
            <Select
              value={String(status)}
              onValueChange={(val) => setStatus(Number(val))}
            >
              <SelectTrigger id="user-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Active</SelectItem>
                <SelectItem value="0">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {saveMutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage(saveMutation.error)}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saveMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
