import type { CeramicModel, DimensionsMm } from '../types/ceramic'

interface ModelListProps {
  models: readonly CeramicModel[]
  selectedId: string
  onSelect: (id: string) => void
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
  removableIds,
  onRemove,
}: ModelListProps) {
  return (
    <ul className="model-list">
      {models.map((model) => {
        const removable = Boolean(onRemove && removableIds?.has(model.id))
        return (
          <li key={model.id}>
            <button
              type="button"
              className={`model-option${removable ? ' model-option-removable' : ''}`}
              aria-pressed={model.id === selectedId}
              onClick={() => onSelect(model.id)}
            >
              <span className="model-name">{model.name}</span>
              <span className="model-size">
                {formatDimensions(model.dimensionsMm)}
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
