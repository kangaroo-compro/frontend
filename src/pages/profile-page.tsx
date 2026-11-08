import { useQuery } from '@tanstack/react-query'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { getMe } from '@/features/auth/api'
import { ProfileContent } from '@/features/profile/components/profile-content'
import { errorMessage } from '@/lib/api'

/** Opened from the user menu; every signed-in user sees their own profile and nothing here needs a permission. */
export function ProfilePage() {
  const me = useQuery({ queryKey: ['me'], queryFn: getMe, staleTime: Infinity })

  return (
    <div className="flex w-full flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Profile</h1>
      </header>

      {me.isPending && <Skeleton className="h-96 w-full" />}
      {me.isError && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(me.error)}</AlertDescription>
        </Alert>
      )}
      {me.data && <ProfileContent user={me.data} />}
    </div>
  )
}
