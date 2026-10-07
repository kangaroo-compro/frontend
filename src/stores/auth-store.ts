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
  setSession: (session: Session | null) => void
}

// sessionStorage keeps the session across reloads of this tab only.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
    }),
    { name: 'manager-session', storage: createJSONStorage(() => sessionStorage) },
  ),
)
