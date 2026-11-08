import { api, type Envelope } from '@/lib/api'
import type { User } from '@/features/users/types'

/** Changes the signed-in user's own name and/or email. A changed email makes the Manager revoke every refresh token. */
export async function updateMe(patch: { name?: string; email?: string }): Promise<User> {
  const { data } = await api.patch<Envelope<User>>('/me', patch)
  return data.data
}

/** Changes the signed-in user's own password. The Manager then revokes every refresh token. */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post('/me/password', { current_password: currentPassword, new_password: newPassword })
}
