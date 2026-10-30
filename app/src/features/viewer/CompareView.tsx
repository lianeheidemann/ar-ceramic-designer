import { useRef, useState } from 'react'
import { findPreset } from '../material/presets'
import { variantIds, type VariantId } from '../material/variants'
import type { CeramicModel, MaterialSettings } from '../../shared/types'
import { CameraSync } from './CameraSync'
import type { ModelInfo } from './modelInfo'
import type { ArState } from '../ar/arStatus'
import { Viewer, type ViewerHandle } from './Viewer'
import { ViewerActions } from './ViewerActions'

interface CompareViewProps {
  model: CeramicModel
  materials: Record<VariantId, MaterialSettings>
  active: VariantId
  onActiveChange: (variant: VariantId) => void
  /** Shows "View in AR" (for the variant being edited). */
  arSupported: boolean
  /** Uniform scale of the piece (its real size). */
  scale?: number
  /** Height the piece is shown at, adjustable in AR. */
  heightMm?: number
  onHeightChange?: (heightMm: number) => void
  onInfo?: (modelId: string, info: ModelInfo) => void
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
  arSupported,
  scale,
  heightMm,
  onHeightChange,
  onInfo,
}: CompareViewProps) {
  const [cameraSync] = useState(() => new CameraSync())
  const viewers = useRef<Partial<Record<VariantId, ViewerHandle | null>>>({})
  const [ar, setAr] = useState<ArState>('off')
  const each = (action: (viewer: ViewerHandle) => void) =>
    variantIds.forEach((variant) => {
      const viewer = viewers.current[variant]
      if (viewer) action(viewer)
    })

  return (
    <div className="compare">
      <div className="compare-split">
        {variantIds.map((variant) => (
          <div
            key={variant}
            className="compare-pane"
            data-active={variant === active}
          >
            <Viewer
              ref={(viewer) => {
                viewers.current[variant] = viewer
              }}
              model={model}
              material={materials[variant]}
              cameraSync={cameraSync}
              label={`Variant ${variant}`}
              scale={scale}
              heightMm={heightMm}
              onHeightChange={onHeightChange}
              onInfo={onInfo}
              hideActions
              onArStateChange={variant === active ? setAr : undefined}
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
      {/* One set of buttons: images of both sides, AR of the edited one. */}
      <ViewerActions
        ar={ar}
        arSupported={arSupported}
        onSaveImage={() => each((viewer) => viewer.saveImage())}
        onResetView={() => each((viewer) => viewer.resetView())}
        onStartAr={() => viewers.current[active]?.startAr()}
      />
    </div>
  )
}
