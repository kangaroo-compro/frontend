import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { errorMessage } from '@/lib/api'
import { deleteRole, updateRole } from '../api'
import { PERMISSION_TREE } from '../permissions'
import type { Role } from '../types'
import { ConfirmDeleteDialog } from './confirm-delete-dialog'
import { RoleAccessTree } from './role-access-tree'

type Props = {
  role: Role
  canUpdate: boolean
  canDelete: boolean
}

const sameAccess = (a: string[], b: string[]) => a.length === b.length && a.every((k) => b.includes(k))

/** Mounted with a key per role version, so the draft resets whenever the saved role changes. */
export function RoleEditor({ role, canUpdate, canDelete }: Props) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(role.name)
  const [access, setAccess] = useState(role.access)
  const [confirming, setConfirming] = useState(false)

  const dirty = name !== role.name || !sameAccess(access, role.access)

  const save = useMutation({
    mutationFn: () => updateRole(role.id, { name, access }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })

  const remove = useMutation({
    mutationFn: () => deleteRole(role.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      setConfirming(false)
    },
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        <Input
          aria-label="Role name"
          className="max-w-xs text-base font-semibold"
          maxLength={50}
          value={name}
          disabled={!canUpdate}
          onChange={(e) => setName(e.target.value)}
        />
        {canDelete && (
          <Button variant="destructive" className="ml-auto" onClick={() => setConfirming(true)}>
            Delete role
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Role access</p>
        <RoleAccessTree nodes={PERMISSION_TREE} value={access} onChange={setAccess} disabled={!canUpdate} />
      </CardContent>
      {canUpdate && (
        <CardFooter className="flex flex-wrap items-center justify-end gap-2">
          {save.isError && (
            <p role="alert" className="mr-auto text-sm text-destructive">
              {errorMessage(save.error)}
            </p>
          )}
          <Button
            variant="outline"
            disabled={!dirty || save.isPending}
            onClick={() => {
              setName(role.name)
              setAccess(role.access)
              save.reset()
            }}
          >
            Reset
          </Button>
          <Button disabled={!dirty || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </CardFooter>
      )}

      {confirming && (
        <ConfirmDeleteDialog
          title="Delete role"
          description={`"${role.name}" will be removed. A role that users still have cannot be deleted.`}
          pending={remove.isPending}
          error={remove.isError ? errorMessage(remove.error) : null}
          onConfirm={() => remove.mutate()}
          onClose={() => {
            remove.reset()
            setConfirming(false)
          }}
        />
      )}
    </Card>
  )
}
