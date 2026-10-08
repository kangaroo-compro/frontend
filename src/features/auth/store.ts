import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type Session = {
  accessToken: string
  refreshToken: string
  /** epoch ms */
  accessExpiresAt: number
  /** epoch ms */
  refreshExpiresAt: number
}

type AuthState = {
  session: Session | null
  /** Shown on the login page after a forced sign-out. */
  notice: string | null
  setSession: (session: Session) => void
  signOut: (notice?: string) => void
}

// sessionStorage keeps the session across reloads of this tab only.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      notice: null,
      setSession: (session) => set({ session, notice: null }),
      signOut: (notice) => set({ session: null, notice: notice ?? null }),
    }),
    {
      name: 'manager-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ session: state.session }),
    },
  ),
)
