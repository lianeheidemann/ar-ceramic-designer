import { useState } from 'react'
import type { CeramicModel, MaterialSettings } from '../../shared/types'
import { defaultVariantMaterial, type VariantId } from './variants'

type Overrides = Record<VariantId, Record<string, MaterialSettings>>

/**
 * Customized materials per variant and model id; the catalog defaults stay
 * untouched. Variant A is the regular (non-comparison) material.
 */
export function useMaterials(
  model: CeramicModel | undefined,
  editedVariant: VariantId,
) {
  const [overrides, setOverrides] = useState<Overrides>({ A: {}, B: {} })

  function variantMaterial(variant: VariantId): MaterialSettings | undefined {
    if (!model) return undefined
    return (
      overrides[variant][model.id] ?? defaultVariantMaterial(model, variant)
    )
  }

  function updateMaterial(next: MaterialSettings) {
    if (!model) return
    setOverrides((all) => ({
      ...all,
      [editedVariant]: { ...all[editedVariant], [model.id]: next },
    }))
  }

  function resetMaterial() {
    if (!model) return
    setOverrides((all) => {
      const rest = { ...all[editedVariant] }
      delete rest[model.id]
      return { ...all, [editedVariant]: rest }
    })
  }

  /** Drops a model's materials, e.g. when it leaves the list. */
  function forget(modelId: string) {
    setOverrides((all) => {
      const a = { ...all.A }
      const b = { ...all.B }
      delete a[modelId]
      delete b[modelId]
      return { A: a, B: b }
    })
  }

  return {
    material: variantMaterial(editedVariant),
    variantMaterial,
    updateMaterial,
    resetMaterial,
    forget,
  }
}
