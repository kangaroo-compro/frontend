import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { initials } from '@/features/auth/initials'
import type { User } from '@/features/users/types'
import { PasswordSection } from './password-section'
import { PersonalInformationSection } from './personal-information-section'

/** The profile page body, straight on the page: who you are, then personal information and password. */
export function ProfileContent({ user }: { user: User }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Avatar size="lg" className="size-12">
          <AvatarFallback className="text-base font-semibold">{initials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-semibold">{user.name}</span>
          <span className="truncate text-sm text-muted-foreground">{user.email}</span>
        </div>
        <Badge variant="secondary" className="ml-auto">
          {user.role_name}
        </Badge>
      </div>
      <Separator />
      {/* key: a saved change remounts the form with the stored values */}
      <PersonalInformationSection key={user.updated_at} user={user} />
      <Separator />
      <PasswordSection />
    </div>
  )
}
