import { useEffect, useState } from 'react'
import { useArSupport } from '../features/ar/useArSupport'
import { MaterialPanel } from '../features/material/MaterialPanel'
import { useMaterials } from '../features/material/useMaterials'
import type { VariantId } from '../features/material/variants'
import { ModelDetails } from '../features/models/ModelDetails'
import { ModelImport } from '../features/models/ModelImport'
import { ModelList } from '../features/models/ModelList'
import { RealSizeControl } from '../features/models/RealSizeControl'
import { useModels } from '../features/models/useModels'
import { CompareView } from '../features/viewer/CompareView'
import type { ModelInfo } from '../features/viewer/modelInfo'
import { Viewer } from '../features/viewer/Viewer'
import type { CeramicModel, MaterialSettings } from '../shared/types'
import { CubeIcon, PaletteIcon } from '../shared/icons'
import { Tabs } from '../shared/Tabs'
import { AppHeader } from './AppHeader'
import { useEditHistory } from './useEditHistory'
import { useTheme } from './useTheme'

function App() {
  const [theme, toggleTheme] = useTheme()
  /** `null`: the first default model. */
  const [chosenId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<'models' | 'material'>('models')
  const [comparing, setComparing] = useState(false)
  const [activeVariant, setActiveVariant] = useState<VariantId>('A')
  /** What each loaded model is made of, by id (from the viewer). */
  const [infoById, setInfoById] = useState<Record<string, ModelInfo>>({})
  /** Pictures taken by the viewer for models without one, by id. */
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  const arSupport = useArSupport()
  const arSupported = arSupport.kind === 'supported'
  const models = useModels()
  const selectedId = chosenId ?? models.defaultId ?? ''
  const selectedModel = models.models.find((model) => model.id === selectedId)
  const editedVariant = comparing ? activeVariant : 'A'
  const materials = useMaterials(selectedModel, editedVariant)
  const { material, variantMaterial } = materials

  // Undo and redo put the value back and show the piece it belongs to.
  const history = useEditHistory((edit, direction) => {
    if (edit.kind === 'material') {
      const value = direction === 'undo' ? edit.before : edit.after
      materials.setOverride(edit.variant, edit.modelId, value)
      if (edit.variant === 'B') setComparing(true)
      setActiveVariant(edit.variant)
    } else {
      models.setHeight(
        edit.modelId,
        direction === 'undo' ? edit.before : edit.after,
      )
    }
    if (models.models.some((model) => model.id === edit.modelId)) {
      setSelectedId(edit.modelId)
    }
  })

  function editMaterial(next: MaterialSettings | undefined) {
    if (!selectedModel) return
    history.record({
      kind: 'material',
      modelId: selectedModel.id,
      variant: editedVariant,
      before: materials.overrideOf(editedVariant, selectedModel.id),
      after: next,
    })
    if (next) materials.updateMaterial(next)
    else materials.resetMaterial()
  }

  function editHeight(id: string, heightMm: number) {
    history.record({
      kind: 'height',
      modelId: id,
      before: models.heightOverride(id),
      after: heightMm,
    })
    models.setHeight(id, heightMm)
  }

  // Ctrl+Z / Ctrl+Shift+Z (or Ctrl+Y); text fields keep their own undo.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey)) return
      const target = event.target as HTMLElement
      if (target.matches('input[type=text], input[type=number], textarea')) {
        return
      }
      const key = event.key.toLowerCase()
      if (key === 'z' && !event.shiftKey) history.undo()
      else if (key === 'y' || (key === 'z' && event.shiftKey)) history.redo()
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  function importModel(model: CeramicModel, realHeightMm?: number) {
    models.addImported(model, realHeightMm)
    setSelectedId(model.id)
  }

  function removeImportedModel(id: string) {
    if (!models.removeImported(id)) return
    materials.forget(id)
    if (selectedId === id) setSelectedId(null)
  }

  const sizeProps = selectedModel && {
    scale: models.scaleOf(selectedModel),
    heightMm: models.heightOf(selectedModel),
    onHeightChange: (heightMm: number) =>
      editHeight(selectedModel.id, heightMm),
    onInfo: (modelId: string, info: ModelInfo) =>
      setInfoById((all) => ({ ...all, [modelId]: info })),
    onThumbnail: (modelId: string, url: string) =>
      setThumbnails((all) => (all[modelId] ? all : { ...all, [modelId]: url })),
  }

  return (
    <div className="app" data-theme={theme}>
      <AppHeader
        theme={theme}
        onToggleTheme={toggleTheme}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onUndo={history.undo}
        onRedo={history.redo}
      />

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
          <p className="viewport-placeholder">
            {models.ready ? 'No model selected' : 'Loading models…'}
          </p>
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
              icon: <CubeIcon />,
              content: (
                <>
                  <ModelList
                    models={models.listedModels}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    thumbnails={thumbnails}
                    removableIds={models.importedIds}
                    onRemove={removeImportedModel}
                  />
                  <ModelImport onImport={importModel} />
                  {selectedModel && (
                    <RealSizeControl
                      key={selectedModel.id}
                      originalDimensionsMm={selectedModel.dimensionsMm}
                      heightMm={models.heightOf(selectedModel)}
                      onChange={(heightMm) =>
                        editHeight(selectedModel.id, heightMm)
                      }
                    />
                  )}
                  {selectedModel && (
                    <ModelDetails
                      model={selectedModel}
                      imported={models.importedIds.has(selectedModel.id)}
                      info={infoById[selectedModel.id]}
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
              icon: <PaletteIcon />,
              content: selectedModel && material && (
                <MaterialPanel
                  model={selectedModel}
                  material={material}
                  comparing={comparing}
                  onComparingChange={setComparing}
                  activeVariant={activeVariant}
                  onActiveVariantChange={setActiveVariant}
                  onChange={editMaterial}
                  onReset={() => editMaterial(undefined)}
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
