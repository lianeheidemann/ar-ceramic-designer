import { useState } from 'react'
import { findPreset } from '../material/presets'
import { variantIds, type VariantId } from '../material/variants'
import type { CeramicModel, MaterialSettings } from '../../shared/types'
import { CameraSync } from './CameraSync'
import { Viewer } from './Viewer'

interface CompareViewProps {
  model: CeramicModel
  materials: Record<VariantId, MaterialSettings>
  active: VariantId
  onActiveChange: (variant: VariantId) => void
  /** Narrow screens show one viewer with an A/B switch instead of two. */
  compact: boolean
  /** AR is offered only in the compact (single viewer) layout. */
  arSupported: boolean
  /** Uniform scale of the piece (its real size). */
  scale?: number
  /** Height the piece is shown at, adjustable in AR. */
  heightMm?: number
  onHeightChange?: (heightMm: number) => void
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
      <span>{findPreset(material)?.name ?? 'Custom'}</span>
    </>
  )
}

export function CompareView({
  model,
  materials,
  active,
  onActiveChange,
  compact,
  arSupported,
  scale,
  heightMm,
  onHeightChange,
}: CompareViewProps) {
  const [cameraSync] = useState(() => new CameraSync())

  if (compact) {
    return (
      <div className="compare compare-compact">
        <Viewer
          model={model}
          material={materials[active]}
          label={`Variant ${active}`}
          arSupported={arSupported}
          scale={scale}
          heightMm={heightMm}
          onHeightChange={onHeightChange}
        />
        <div className="variant-switch" role="group" aria-label="Variant">
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
            label={`Variant ${variant}`}
            scale={scale}
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
