import { CheckIcon, CubeIcon } from '../../shared/icons'
import type { CeramicModel, DimensionsMm } from '../../shared/types'

interface ModelListProps {
  models: readonly CeramicModel[]
  selectedId: string
  onSelect: (id: string) => void
  /** Pictures taken by the viewer, for models without their own. */
  thumbnails?: Readonly<Record<string, string>>
  /** Models that show a "×" to take them off the list (imported ones). */
  removableIds?: ReadonlySet<string>
  onRemove?: (id: string) => void
}

function formatDimensions({ width, height }: DimensionsMm): string {
  return `⌀ ${width} × ${height} mm`
}

export function ModelList({
  models,
  selectedId,
  onSelect,
  thumbnails,
  removableIds,
  onRemove,
}: ModelListProps) {
  return (
    <ul className="model-list">
      {models.map((model) => {
        const removable = Boolean(onRemove && removableIds?.has(model.id))
        const selected = model.id === selectedId
        const thumbnail = model.thumbnailUrl ?? thumbnails?.[model.id]
        return (
          <li key={model.id}>
            <button
              type="button"
              className={`model-option${removable ? ' model-option-removable' : ''}`}
              aria-pressed={selected}
              onClick={() => onSelect(model.id)}
            >
              <span className="model-thumb" aria-hidden="true">
                {thumbnail ? <img src={thumbnail} alt="" /> : <CubeIcon />}
              </span>
              <span className="model-text">
                <span className="model-name">{model.name}</span>
                <span className="model-size">
                  {formatDimensions(model.dimensionsMm)}
                </span>
              </span>
              <span className="model-mark" aria-hidden="true">
                {selected && <CheckIcon />}
              </span>
            </button>
            {/* A sibling, not a child: buttons cannot be nested. */}
            {removable && (
              <button
                type="button"
                className="model-remove"
                aria-label={`Remove ${model.name}`}
                title="Remove"
                onClick={() => onRemove?.(model.id)}
              >
                <span aria-hidden="true">×</span>
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
