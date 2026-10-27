import { useState } from 'react'
import { MaterialControls } from './components/MaterialControls'
import { ModelList } from './components/ModelList'
import { Viewer } from './components/Viewer'
import { catalog, defaultModelId, getModelById } from './data/catalog'
import type { MaterialSettings } from './types/ceramic'

function App() {
  const [selectedId, setSelectedId] = useState(defaultModelId)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = window.localStorage.getItem('ar-ceramic-theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })
  // Customized materials by model id; the catalog defaults stay untouched.
  const [materialOverrides, setMaterialOverrides] = useState<
    Record<string, MaterialSettings>
  >({})
  const selectedModel = getModelById(selectedId)
  const material = selectedModel
    ? (materialOverrides[selectedModel.id] ?? selectedModel.defaultMaterial)
    : undefined

  function updateMaterial(next: MaterialSettings) {
    setMaterialOverrides((overrides) => ({ ...overrides, [selectedId]: next }))
  }

  function resetMaterial() {
    setMaterialOverrides((overrides) => {
      const rest = { ...overrides }
      delete rest[selectedId]
      return rest
    })
  }

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    window.localStorage.setItem('ar-ceramic-theme', nextTheme)
  }

  return (
    <div className="app" data-theme={theme}>
      <header className="app-header">
        <img
          className="app-logo"
          src={`${import.meta.env.BASE_URL}favicon.svg`}
          alt=""
          aria-hidden="true"
        />
        <h1>AR Ceramic Designer</h1>
        <button
          className="theme-toggle"
          type="button"
          onClick={toggleTheme}
          aria-label={
            theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'
          }
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
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

      <main className="viewport" aria-label="Visualizador 3D">
        {selectedModel && material ? (
          <Viewer model={selectedModel} material={material} />
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
        {selectedModel && material && (
          <section className="controls-section">
            <h2>Material</h2>
            <MaterialControls
              material={material}
              original={selectedModel.defaultMaterial}
              onChange={updateMaterial}
              onReset={resetMaterial}
            />
          </section>
        )}
      </aside>
    </div>
  )
}

export default App
