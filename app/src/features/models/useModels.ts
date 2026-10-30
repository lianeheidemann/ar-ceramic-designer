import { useEffect, useState } from 'react'
import type { CeramicModel } from '../../shared/types'
import { catalog } from './catalog'
import { defaultFiles, loadDefaultModels } from './defaultModels'

/**
 * The default models plus models opened from .glb files (they last until
 * the page reloads), and the real height the user gave each model. The
 * defaults are the .glb files in `defaults/`, or the generated catalog when
 * there are none (or none can be read).
 */
export function useModels() {
  /** `null` while the default .glb files are being read. */
  const [defaults, setDefaults] = useState<readonly CeramicModel[] | null>(
    () => (defaultFiles.length ? null : catalog),
  )
  const [importedModels, setImportedModels] = useState<CeramicModel[]>([])
  /** Real height (mm) the user gave each model, by id. */
  const [realHeights, setRealHeights] = useState<Record<string, number>>({})
  const models = [...(defaults ?? []), ...importedModels]

  useEffect(() => {
    if (!defaultFiles.length) return
    let cancelled = false
    loadDefaultModels().then((loaded) => {
      if (cancelled) return
      setDefaults(loaded.length ? loaded.map(({ model }) => model) : catalog)
      // Unlikely sizes start fitted, as imports do; user values stay.
      setRealHeights((all) => {
        const next = { ...all }
        for (const { model, realHeightMm } of loaded) {
          if (realHeightMm !== undefined) next[model.id] ??= realHeightMm
        }
        return next
      })
    })
    return () => {
      cancelled = true
    }
  }, [])

  /** Height (mm) the model is shown at, in the viewer and in AR. */
  const heightOf = (model: CeramicModel) =>
    realHeights[model.id] ?? model.dimensionsMm.height
  /** Scale that gives a model its real height (1 = original size). */
  const scaleOf = (model: CeramicModel) =>
    heightOf(model) / model.dimensionsMm.height

  function setHeight(id: string, heightMm: number) {
    setRealHeights((all) => ({ ...all, [id]: heightMm }))
  }

  // The list shows real sizes; the viewer keeps the original objects so a
  // size change does not reload the file.
  const listedModels = models.map((model) => {
    const scale = scaleOf(model)
    if (scale === 1) return model
    const { width, height, depth } = model.dimensionsMm
    return {
      ...model,
      dimensionsMm: {
        width: Math.round(width * scale),
        height: Math.round(height * scale),
        depth: Math.round(depth * scale),
      },
    }
  })

  function addImported(model: CeramicModel, realHeightMm?: number) {
    setImportedModels((list) => [...list, model])
    if (realHeightMm !== undefined) setHeight(model.id, realHeightMm)
  }

  /** Takes an imported model off the list and frees its file. */
  function removeImported(id: string): boolean {
    const model = importedModels.find((item) => item.id === id)
    if (!model) return false
    setImportedModels((list) => list.filter((item) => item.id !== id))
    if (model.source.kind === 'glb') URL.revokeObjectURL(model.source.url)
    setRealHeights((all) => {
      const rest = { ...all }
      delete rest[id]
      return rest
    })
    return true
  }

  return {
    /** False while the default models are being read. */
    ready: defaults !== null,
    models,
    /** The model shown first. */
    defaultId: models[0]?.id,
    getModel: (id: string) => models.find((model) => model.id === id),
    listedModels,
    importedIds: new Set(importedModels.map((model) => model.id)),
    heightOf,
    scaleOf,
    setHeight,
    addImported,
    removeImported,
  }
}
