import { useState } from 'react'
import { CompareView } from './components/CompareView'
import { ConfigControls } from './components/ConfigControls'
import { MaterialControls } from './components/MaterialControls'
import { ModelList } from './components/ModelList'
import { Viewer } from './components/Viewer'
import { catalog, defaultModelId } from './data/catalog'
import { useArSupport } from './hooks/useArSupport'
import { useMediaQuery } from './hooks/useMediaQuery'
import {
  defaultVariantMaterial,
  variantIds,
  type VariantId,
} from './materials/variants'
import type { CeramicModel, MaterialSettings } from './types/ceramic'
import type { CeramicConfig } from './utils/config'

type Overrides = Record<VariantId, Record<string, MaterialSettings>>

function App() {
  const [selectedId, setSelectedId] = useState(defaultModelId)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = window.localStorage.getItem('ar-ceramic-theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })
  // Customized materials per variant and model id; the catalog defaults
  // stay untouched. Variant A is the regular (non-comparison) material.
  const [overrides, setOverrides] = useState<Overrides>({ A: {}, B: {} })
  /** Models opened from .glb files; they last until the page reloads. */
  const [importedModels, setImportedModels] = useState<CeramicModel[]>([])
  const [comparing, setComparing] = useState(false)
  const [activeVariant, setActiveVariant] = useState<VariantId>('A')
  const compact = useMediaQuery('(max-width: 768px)')
  const arSupport = useArSupport()
  const arSupported = arSupport.kind === 'supported'
  const models = [...catalog, ...importedModels]
  const selectedModel = models.find((model) => model.id === selectedId)
  const editedVariant = comparing ? activeVariant : 'A'

  function variantMaterial(variant: VariantId): MaterialSettings | undefined {
    if (!selectedModel) return undefined
    return (
      overrides[variant][selectedModel.id] ??
      defaultVariantMaterial(selectedModel, variant)
    )
  }

  const material = variantMaterial(editedVariant)

  function updateMaterial(next: MaterialSettings) {
    setOverrides((all) => ({
      ...all,
      [editedVariant]: { ...all[editedVariant], [selectedId]: next },
    }))
  }

  function resetMaterial() {
    setOverrides((all) => {
      const rest = { ...all[editedVariant] }
      delete rest[selectedId]
      return { ...all, [editedVariant]: rest }
    })
  }

  function importModel(model: CeramicModel) {
    setImportedModels((list) => [...list, model])
    setSelectedId(model.id)
  }

  /** Shows the imported model with its saved materials. */
  function importConfig({ modelId, variants }: CeramicConfig) {
    setOverrides((all) => {
      const b = { ...all.B }
      if (variants.B) b[modelId] = variants.B
      else delete b[modelId]
      return { A: { ...all.A, [modelId]: variants.A }, B: b }
    })
    setSelectedId(modelId)
    setComparing(variants.B !== undefined)
    setActiveVariant('A')
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
          src={`${import.meta.env.BASE_URL}icons/icon-96.png`}
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
        {selectedModel && material && comparing ? (
          <CompareView
            model={selectedModel}
            materials={{
              A: variantMaterial('A') ?? material,
              B: variantMaterial('B') ?? material,
            }}
            active={activeVariant}
            onActiveChange={setActiveVariant}
            compact={compact}
            arSupported={arSupported}
          />
        ) : selectedModel && material ? (
          <Viewer
            model={selectedModel}
            material={material}
            arSupported={arSupported}
          />
        ) : (
          <p className="viewport-placeholder">Nenhum modelo selecionado</p>
        )}
      </main>

      <aside className="controls" aria-label="Controles">
        <h2>Modelos</h2>
        <ModelList
          models={models}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        {selectedModel && material && (
          <section className="controls-section">
            <div className="section-header">
              <h2>Material</h2>
              <button
                type="button"
                className="compare-toggle"
                aria-pressed={comparing}
                onClick={() => setComparing(!comparing)}
              >
                Comparar A/B
              </button>
            </div>
            {comparing && (
              <div
                className="variant-picker"
                role="group"
                aria-label="Variante em edição"
              >
                {variantIds.map((variant) => (
                  <button
                    key={variant}
                    type="button"
                    className="preset-option"
                    aria-pressed={variant === activeVariant}
                    onClick={() => setActiveVariant(variant)}
                  >
                    Editar {variant}
                  </button>
                ))}
              </div>
            )}
            <MaterialControls
              material={material}
              original={defaultVariantMaterial(selectedModel, editedVariant)}
              onChange={updateMaterial}
              onReset={resetMaterial}
            />
          </section>
        )}
        {selectedModel && material && (
          <section className="controls-section">
            <h2>Configuração</h2>
            <ConfigControls
              model={selectedModel}
              variants={{
                A: variantMaterial('A') ?? material,
                B: comparing ? variantMaterial('B') : undefined,
              }}
              onImport={importConfig}
              onImportModel={importModel}
            />
          </section>
        )}
        {arSupport.kind === 'unavailable' && (
          // Only explains why there is no "Ver em AR" button.
          <section className="controls-section">
            <h2>Realidade aumentada</h2>
            <p className="controls-note">{arSupport.reason}</p>
          </section>
        )}
      </aside>
    </div>
  )
}

export default App
