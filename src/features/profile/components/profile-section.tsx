import type { FormEvent, ReactNode } from 'react'

type Props = {
  title: string
  description: string
  onSubmit: (e: FormEvent) => void
  children: ReactNode
}

/** A settings section: title and one-line description on the left (1/3), the fields on the right (2/3). */
export function ProfileSection({ title, description, onSubmit, children }: Props) {
  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="flex flex-col gap-1">
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col gap-4 md:col-span-2">{children}</div>
    </form>
  )
}
