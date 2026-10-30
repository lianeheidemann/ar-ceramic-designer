import { MoonIcon, SunIcon } from '../shared/icons'
import type { Theme } from './useTheme'

interface AppHeaderProps {
  theme: Theme
  onToggleTheme: () => void
}

export function AppHeader({ theme, onToggleTheme }: AppHeaderProps) {
  const label =
    theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
  return (
    <header className="app-header">
      <img
        className="app-logo"
        src={`${import.meta.env.BASE_URL}icons/icon-96.png`}
        alt=""
        aria-hidden="true"
      />
      <h1>AR Ceramic Designer</h1>
      <button
        className="theme-toggle"
        type="button"
        onClick={onToggleTheme}
        aria-label={label}
        title={label}
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>
    </header>
  )
}
