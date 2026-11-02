import { useAuthStore } from './store'

/** The `access` claim of a JWT, or [] when the token has none or is not decodable. */
export function decodeAccess(token: string | undefined): string[] {
  if (!token) return []
  try {
    const segment = token.split('.')[1]
    if (!segment) return []
    const claims = JSON.parse(atob(segment.replace(/-/g, '+').replace(/_/g, '/'))) as { access?: unknown }
    return Array.isArray(claims.access) ? claims.access.filter((a): a is string => typeof a === 'string') : []
  } catch {
    return []
  }
}

/** True when the signed-in user's role holds the permission. Follows token refresh. */
export function useCan(permission: string): boolean {
  return useAuthStore((s) => decodeAccess(s.session?.accessToken).includes(permission))
}
