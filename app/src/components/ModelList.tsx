import type { CeramicModel, DimensionsMm } from '../types/ceramic'

interface ModelListProps {
  models: readonly CeramicModel[]
  selectedId: string
  onSelect: (id: string) => void
}

function formatDimensions({ width, height }: DimensionsMm): string {
  return `⌀ ${width} × ${height} mm`
}

export function ModelList({ models, selectedId, onSelect }: ModelListProps) {
  return (
    <ul className="model-list">
      {models.map((model) => (
        <li key={model.id}>
          <button
            type="button"
            className="model-option"
            aria-pressed={model.id === selectedId}
            onClick={() => onSelect(model.id)}
          >
            <span className="model-name">{model.name}</span>
            <span className="model-size">
              {formatDimensions(model.dimensionsMm)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
