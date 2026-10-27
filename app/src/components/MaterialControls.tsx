import { useId } from 'react'
import {
  applyPreset,
  findPreset,
  materialPresets,
  sameMaterial,
} from '../materials/presets'
import type { MaterialSettings } from '../types/ceramic'

interface MaterialControlsProps {
  material: MaterialSettings
  original: MaterialSettings
  onChange: (material: MaterialSettings) => void
  onReset: () => void
}

type Slider = 'roughness' | 'metalness'

const sliders: { key: Slider; label: string }[] = [
  { key: 'roughness', label: 'Rugosidade' },
  { key: 'metalness', label: 'Metalicidade' },
]

export function MaterialControls({
  material,
  original,
  onChange,
  onReset,
}: MaterialControlsProps) {
  const id = useId()
  const activePreset = findPreset(material)

  return (
    <div className="material-controls">
      <div className="control-row">
        <span className="control-label">Acabamento</span>
        <span className="control-value">
          {activePreset?.name ?? 'Personalizado'}
        </span>
      </div>
      <div className="preset-list" role="group" aria-label="Acabamento">
        {materialPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="preset-option"
            aria-pressed={preset.id === activePreset?.id}
            onClick={() => onChange(applyPreset(material, preset.id))}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <label className="control-row" htmlFor={`${id}-color`}>
        <span className="control-label">Cor</span>
        <input
          id={`${id}-color`}
          type="color"
          className="color-input"
          value={material.color}
          onChange={(event) =>
            onChange({ ...material, color: event.target.value })
          }
        />
      </label>

      {sliders.map(({ key, label }) => (
        <div key={key} className="slider-field">
          <label className="control-row" htmlFor={`${id}-${key}`}>
            <span className="control-label">{label}</span>
            <span className="control-value">{material[key].toFixed(2)}</span>
          </label>
          <input
            id={`${id}-${key}`}
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={material[key]}
            onChange={(event) =>
              onChange({ ...material, [key]: Number(event.target.value) })
            }
          />
        </div>
      ))}

      <button
        type="button"
        className="reset-material"
        disabled={sameMaterial(material, original)}
        onClick={onReset}
      >
        Restaurar original
      </button>
    </div>
  )
}
