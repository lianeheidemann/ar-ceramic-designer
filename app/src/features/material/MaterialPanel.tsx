import type { CeramicModel, MaterialSettings } from '../../shared/types'
import { MaterialControls } from './MaterialControls'
import { defaultVariantMaterial, variantIds, type VariantId } from './variants'

interface MaterialPanelProps {
  model: CeramicModel
  material: MaterialSettings
  comparing: boolean
  onComparingChange: (comparing: boolean) => void
  /** Variant being edited while comparing. */
  activeVariant: VariantId
  onActiveVariantChange: (variant: VariantId) => void
  onChange: (material: MaterialSettings) => void
  onReset: () => void
}

/** The Material tab: A/B comparison switch and the finish controls. */
export function MaterialPanel({
  model,
  material,
  comparing,
  onComparingChange,
  activeVariant,
  onActiveVariantChange,
  onChange,
  onReset,
}: MaterialPanelProps) {
  const editedVariant = comparing ? activeVariant : 'A'
  return (
    <>
      <div className="section-header">
        <button
          type="button"
          className="compare-toggle"
          aria-pressed={comparing}
          onClick={() => onComparingChange(!comparing)}
        >
          Compare A/B
        </button>
      </div>
      {comparing && (
        <div
          className="variant-picker"
          role="group"
          aria-label="Variant being edited"
        >
          {variantIds.map((variant) => (
            <button
              key={variant}
              type="button"
              className="preset-option"
              aria-pressed={variant === activeVariant}
              onClick={() => onActiveVariantChange(variant)}
            >
              Edit {variant}
            </button>
          ))}
        </div>
      )}
      <MaterialControls
        material={material}
        original={defaultVariantMaterial(model, editedVariant)}
        onChange={onChange}
        onReset={onReset}
      />
    </>
  )
}
