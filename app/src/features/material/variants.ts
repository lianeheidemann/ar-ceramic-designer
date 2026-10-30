import type { CeramicModel, MaterialSettings } from '../../shared/types'
import { applyPreset, findPreset, materialPresets } from './presets'

export type VariantId = 'A' | 'B'

export const variantIds: readonly VariantId[] = ['A', 'B']

/** Keeps B's default stable across renders (same object per model). */
const variantBDefaults = new WeakMap<CeramicModel, MaterialSettings>()

/**
 * Starting material of a comparison variant. A is the model's original;
 * B starts on the next preset so there is a difference to compare.
 */
export function defaultVariantMaterial(
  model: CeramicModel,
  variant: VariantId,
): MaterialSettings {
  const original = model.defaultMaterial
  if (variant === 'A') return original
  let b = variantBDefaults.get(model)
  if (!b) {
    const index = materialPresets.findIndex(
      (preset) => preset.id === findPreset(original)?.id,
    )
    const next = materialPresets[(index + 1) % materialPresets.length]
    b = applyPreset(original, next.id)
    variantBDefaults.set(model, b)
  }
  return b
}
