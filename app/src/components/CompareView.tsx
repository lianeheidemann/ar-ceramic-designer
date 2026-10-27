import { useState } from 'react'
import { findPreset } from '../materials/presets'
import { variantIds, type VariantId } from '../materials/variants'
import type { CeramicModel, MaterialSettings } from '../types/ceramic'
import { CameraSync } from '../viewers/CameraSync'
import { Viewer } from './Viewer'

interface CompareViewProps {
  model: CeramicModel
  materials: Record<VariantId, MaterialSettings>
  active: VariantId
  onActiveChange: (variant: VariantId) => void
  /** Narrow screens show one viewer with an A/B switch instead of two. */
  compact: boolean
}

function VariantSummary({
  variant,
  material,
}: {
  variant: VariantId
  material: MaterialSettings
}) {
  return (
    <>
      <span className="variant-letter">{variant}</span>
      <span
        className="variant-swatch"
        style={{ background: material.color }}
        aria-hidden="true"
      />
      <span>{findPreset(material)?.name ?? 'Personalizado'}</span>
    </>
  )
}

export function CompareView({
  model,
  materials,
  active,
  onActiveChange,
  compact,
}: CompareViewProps) {
  const [cameraSync] = useState(() => new CameraSync())

  if (compact) {
    return (
      <div className="compare compare-compact">
        <Viewer
          model={model}
          material={materials[active]}
          label={`Variante ${active}`}
        />
        <div className="variant-switch" role="group" aria-label="Variante">
          {variantIds.map((variant) => (
            <button
              key={variant}
              type="button"
              className="variant-tag"
              aria-pressed={variant === active}
              onClick={() => onActiveChange(variant)}
            >
              <VariantSummary variant={variant} material={materials[variant]} />
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="compare compare-split">
      {variantIds.map((variant) => (
        <div
          key={variant}
          className="compare-pane"
          data-active={variant === active}
        >
          <Viewer
            model={model}
            material={materials[variant]}
            cameraSync={cameraSync}
            label={`Variante ${variant}`}
          />
          <button
            type="button"
            className="variant-tag compare-pane-tag"
            aria-pressed={variant === active}
            onClick={() => onActiveChange(variant)}
          >
            <VariantSummary variant={variant} material={materials[variant]} />
          </button>
        </div>
      ))}
    </div>
  )
}
