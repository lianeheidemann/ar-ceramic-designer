import { MoonIcon, RedoIcon, SunIcon, UndoIcon } from '../shared/icons'
import type { Theme } from './useTheme'

interface AppHeaderProps {
  theme: Theme
  onToggleTheme: () => void
  /** Undo and redo the last edits to the piece (material, size). */
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}

export function AppHeader({
  theme,
  onToggleTheme,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: AppHeaderProps) {
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
      <div className="history-actions" role="group" aria-label="Edit history">
        <button
          type="button"
          className="header-button"
          disabled={!canUndo}
          onClick={onUndo}
          aria-label="Undo"
          title="Undo (Ctrl+Z)"
        >
          <UndoIcon />
        </button>
        <button
          type="button"
          className="header-button"
          disabled={!canRedo}
          onClick={onRedo}
          aria-label="Redo"
          title="Redo (Ctrl+Shift+Z)"
        >
          <RedoIcon />
        </button>
      </div>
      <button
        className="header-button theme-toggle"
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
