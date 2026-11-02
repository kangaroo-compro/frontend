import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Props = {
  title: string
  description: string
  pending: boolean
  error: string | null
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDeleteDialog({ title, description, pending, error, onConfirm, onClose }: Props) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={pending}>
            {pending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
