import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { User } from '@/features/users/types'

/** Name, email and role of the signed-in user; the role is read-only. */
export function ProfileCard({ user }: { user: User }) {
  const rows = [
    { label: 'Name', value: user.name },
    { label: 'Email', value: user.email },
    { label: 'Role', value: user.role_name },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold tracking-tight">Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">{row.label}</dt>
              <dd className="font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
