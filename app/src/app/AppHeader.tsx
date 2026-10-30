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
        {theme === 'dark' ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z" />
          </svg>
        )}
      </button>
    </header>
  )
}
