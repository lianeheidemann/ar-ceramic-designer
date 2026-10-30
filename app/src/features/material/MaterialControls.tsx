import { useId } from 'react'
import {
  applyPreset,
  findPreset,
  materialPresets,
  sameMaterial,
} from './presets'
import type { MaterialSettings } from '../../shared/types'
import { ColorPicker } from './ColorPicker'

interface MaterialControlsProps {
  material: MaterialSettings
  original: MaterialSettings
  onChange: (material: MaterialSettings) => void
  onReset: () => void
}

type Slider = 'roughness' | 'metalness'

const sliders: { key: Slider; label: string }[] = [
  { key: 'roughness', label: 'Roughness' },
  { key: 'metalness', label: 'Metalness' },
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
        <span className="control-label">Finish</span>
        <span className="control-value">{activePreset?.name ?? 'Custom'}</span>
      </div>
      <div className="preset-list" role="group" aria-label="Finish">
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

      <ColorPicker
        value={material.color}
        onChange={(color) => onChange({ ...material, color })}
      />

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
        Restore original
      </button>
    </div>
  )
}
