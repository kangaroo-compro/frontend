import { useQuery } from '@tanstack/react-query'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { getMe } from '@/features/auth/api'
import { ChangePasswordCard } from '@/features/profile/components/change-password-card'
import { EditProfileCard } from '@/features/profile/components/edit-profile-card'
import { ProfileCard } from '@/features/profile/components/profile-card'
import { errorMessage } from '@/lib/api'

/** Every signed-in user sees their own profile; nothing here needs a permission. */
export function ProfilePage() {
  const me = useQuery({ queryKey: ['me'], queryFn: getMe, staleTime: Infinity })

  return (
    <div className="flex w-full flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Profile</h1>
      </header>

      {me.isPending && <Skeleton className="h-40 w-full" />}
      {me.isError && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(me.error)}</AlertDescription>
        </Alert>
      )}
      {me.data && (
        <>
          <ProfileCard user={me.data} />
          <EditProfileCard key={me.data.updated_at} user={me.data} />
          <ChangePasswordCard />
        </>
      )}
    </div>
  )
}
