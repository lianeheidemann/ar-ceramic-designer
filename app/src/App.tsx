import { useState } from 'react'
import { ModelList } from './components/ModelList'
import { Viewer } from './components/Viewer'
import { catalog, defaultModelId, getModelById } from './data/catalog'

function App() {
  const [selectedId, setSelectedId] = useState(defaultModelId)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = window.localStorage.getItem('ar-ceramic-theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const selectedModel = getModelById(selectedId)

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    window.localStorage.setItem('ar-ceramic-theme', nextTheme)
  }

  return (
    <div className="app" data-theme={theme}>
      <header className="app-header">
        <img className="app-logo" src="/favicon.svg" alt="" aria-hidden="true" />
        <h1>AR Ceramic Designer</h1>
        <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'} title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}>
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z" /></svg>
          )}
        </button>
      </header>

      <main className="viewport" aria-label="Visualizador 3D">
        {selectedModel ? (
          <Viewer model={selectedModel} />
        ) : (
          <p className="viewport-placeholder">Nenhum modelo selecionado</p>
        )}
      </main>

      <aside className="controls" aria-label="Controles">
        <h2>Modelos</h2>
        <ModelList
          models={catalog}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </aside>
    </div>
  )
}

export default App
