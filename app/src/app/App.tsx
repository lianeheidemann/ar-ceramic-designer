import { useState } from 'react'
import { useArSupport } from '../features/ar/useArSupport'
import { MaterialPanel } from '../features/material/MaterialPanel'
import { useMaterials } from '../features/material/useMaterials'
import type { VariantId } from '../features/material/variants'
import { defaultModelId } from '../features/models/catalog'
import { ModelList } from '../features/models/ModelList'
import { RealSizeControl } from '../features/models/RealSizeControl'
import { useModels } from '../features/models/useModels'
import type { CeramicConfig } from '../features/settings/config'
import { ConfigControls } from '../features/settings/ConfigControls'
import { CompareView } from '../features/viewer/CompareView'
import { Viewer } from '../features/viewer/Viewer'
import type { CeramicModel } from '../shared/types'
import { Tabs } from '../shared/Tabs'
import { useMediaQuery } from '../shared/useMediaQuery'
import { AppHeader } from './AppHeader'
import { useTheme } from './useTheme'

function App() {
  const [theme, toggleTheme] = useTheme()
  const [selectedId, setSelectedId] = useState(defaultModelId)
  const [tab, setTab] = useState<'models' | 'material' | 'config'>('models')
  const [comparing, setComparing] = useState(false)
  const [activeVariant, setActiveVariant] = useState<VariantId>('A')
  const compact = useMediaQuery('(max-width: 768px)')
  const arSupport = useArSupport()
  const arSupported = arSupport.kind === 'supported'
  const models = useModels()
  const selectedModel = models.models.find((model) => model.id === selectedId)
  const editedVariant = comparing ? activeVariant : 'A'
  const materials = useMaterials(selectedModel, editedVariant)
  const { material, variantMaterial } = materials

  function importModel(model: CeramicModel, realHeightMm?: number) {
    models.addImported(model, realHeightMm)
    setSelectedId(model.id)
  }

  function removeImportedModel(id: string) {
    if (!models.removeImported(id)) return
    materials.forget(id)
    if (selectedId === id) setSelectedId(defaultModelId)
  }

  /** Shows the model with the imported settings' materials. */
  function importConfig({ modelId, variants }: CeramicConfig) {
    materials.setVariants(modelId, variants)
    setSelectedId(modelId)
    setComparing(variants.B !== undefined)
    setActiveVariant('A')
  }

  const sizeProps = selectedModel && {
    scale: models.scaleOf(selectedModel),
    heightMm: models.heightOf(selectedModel),
    onHeightChange: (heightMm: number) =>
      models.setHeight(selectedModel.id, heightMm),
  }

  return (
    <div className="app" data-theme={theme}>
      <AppHeader theme={theme} onToggleTheme={toggleTheme} />

      <main className="viewport" aria-label="3D viewer">
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
            {...sizeProps}
          />
        ) : selectedModel && material ? (
          <Viewer
            model={selectedModel}
            material={material}
            arSupported={arSupported}
            {...sizeProps}
          />
        ) : (
          <p className="viewport-placeholder">No model selected</p>
        )}
      </main>

      <aside className="controls" aria-label="Controls">
        <Tabs
          label="Controls"
          active={tab}
          onChange={setTab}
          tabs={[
            {
              id: 'models',
              label: 'Models',
              content: (
                <>
                  <ModelList
                    models={models.listedModels}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    removableIds={models.importedIds}
                    onRemove={removeImportedModel}
                  />
                  {selectedModel && (
                    <RealSizeControl
                      key={selectedModel.id}
                      originalDimensionsMm={selectedModel.dimensionsMm}
                      heightMm={models.heightOf(selectedModel)}
                      onChange={(heightMm) =>
                        models.setHeight(selectedModel.id, heightMm)
                      }
                    />
                  )}
                  {arSupport.kind === 'unavailable' && (
                    // Only explains why there is no "View in AR" button.
                    <section className="controls-section">
                      <h2>Augmented reality</h2>
                      <p className="controls-note">{arSupport.reason}</p>
                    </section>
                  )}
                </>
              ),
            },
            {
              id: 'material',
              label: 'Material',
              content: selectedModel && material && (
                <MaterialPanel
                  model={selectedModel}
                  material={material}
                  comparing={comparing}
                  onComparingChange={setComparing}
                  activeVariant={activeVariant}
                  onActiveVariantChange={setActiveVariant}
                  onChange={materials.updateMaterial}
                  onReset={materials.resetMaterial}
                />
              ),
            },
            {
              id: 'config',
              label: 'Settings',
              content: selectedModel && material && (
                <ConfigControls
                  model={selectedModel}
                  variants={{
                    A: variantMaterial('A') ?? material,
                    B: comparing ? variantMaterial('B') : undefined,
                  }}
                  onImport={importConfig}
                  onImportModel={importModel}
                />
              ),
            },
          ]}
        />
      </aside>
    </div>
  )
}

export default App
