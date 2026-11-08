import { Moon, Sun } from 'lucide-react'
import { IconButton } from '@/components/icon-button'
import { useTheme } from './use-theme'

/** Shows the mode you would switch to: Moon in light mode, Sun in dark mode. */
export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <IconButton label={dark ? 'Switch to light mode' : 'Switch to dark mode'} variant="ghost" onClick={toggle}>
      {dark ? <Sun /> : <Moon />}
    </IconButton>
  )
}
