import { useId, useState, type CSSProperties } from 'react'
import { ChevronDownIcon } from '../../shared/icons'
import { GLAZE_COLORS, hexToHsl, hslToHex, parseHex, type Hsl } from './color'

interface ColorPickerProps {
  /** Hex color, e.g. `#c8b6a6`. */
  value: string
  onChange: (hex: string) => void
}

type Channel = keyof Hsl

const channels: { key: Channel; label: string; max: number; unit: string }[] = [
  { key: 'h', label: 'Hue', max: 360, unit: '°' },
  { key: 's', label: 'Saturation', max: 100, unit: '%' },
  { key: 'l', label: 'Lightness', max: 100, unit: '%' },
]

/** The gradient behind each slider, for the current color. */
function track(key: Channel, { h, s, l }: Hsl): string {
  if (key === 'h') {
    const stops = [0, 60, 120, 180, 240, 300, 360].map(
      (hue) => `hsl(${hue} ${s}% ${l}%)`,
    )
    return `linear-gradient(to right, ${stops.join(', ')})`
  }
  if (key === 's') {
    return `linear-gradient(to right, hsl(${h} 0% ${l}%), hsl(${h} 100% ${l}%))`
  }
  return `linear-gradient(to right, #000, hsl(${h} ${s}% 50%), #fff)`
}

/**
 * Color of the piece, in the app's own style (the browser's color dialog
 * cannot be styled): glaze swatches, and hue, saturation and lightness
 * sliders. Changes apply at once; "Restore original" undoes them.
 */
export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  // HSL is kept while dragging, so the hue survives on greys and whites;
  // it is taken from `value` again when that changes from outside.
  const [draft, setDraft] = useState({ hsl: hexToHsl(value), value })
  const [hexText, setHexText] = useState({ text: value, value })
  if (draft.value !== value) setDraft({ hsl: hexToHsl(value), value })
  if (hexText.value !== value) setHexText({ text: value, value })
  const glaze = GLAZE_COLORS.find((color) => color.hex === value)

  function setChannel(key: Channel, amount: number) {
    const hsl = { ...draft.hsl, [key]: amount }
    const hex = hslToHex(hsl)
    setDraft({ hsl, value: hex })
    onChange(hex)
  }

  return (
    <div className="color-picker">
      <div className="control-row">
        <span className="control-label" id={`${id}-label`}>
          Color
        </span>
        <button
          type="button"
          className="color-current"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          aria-labelledby={`${id}-label ${id}-value`}
          onClick={() => setOpen(!open)}
        >
          <span className="color-chip" style={{ background: value }} />
          <span id={`${id}-value`}>{glaze?.name ?? value}</span>
          <ChevronDownIcon className="color-chevron" />
        </button>
      </div>
      <div className="color-panel" id={`${id}-panel`} hidden={!open}>
        <div className="glaze-list" role="group" aria-label="Glaze colors">
          {GLAZE_COLORS.map((color) => (
            <button
              key={color.hex}
              type="button"
              className="glaze-option"
              aria-label={color.name}
              title={color.name}
              aria-pressed={color.hex === value}
              style={{ background: color.hex }}
              onClick={() => onChange(color.hex)}
            />
          ))}
        </div>
        {channels.map(({ key, label, max, unit }) => (
          <div key={key} className="slider-field">
            <label className="control-row" htmlFor={`${id}-${key}`}>
              <span className="control-label">{label}</span>
              <span className="control-value">
                {draft.hsl[key]}
                {unit}
              </span>
            </label>
            <input
              id={`${id}-${key}`}
              type="range"
              className="color-slider"
              min={0}
              max={max}
              step={1}
              value={draft.hsl[key]}
              style={{ '--track': track(key, draft.hsl) } as CSSProperties}
              onChange={(event) => setChannel(key, Number(event.target.value))}
            />
          </div>
        ))}
        <label className="control-row" htmlFor={`${id}-hex`}>
          <span className="control-label">Hex</span>
          <input
            id={`${id}-hex`}
            className="hex-input"
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            maxLength={7}
            value={hexText.text}
            onChange={(event) => {
              const text = event.target.value
              const hex = parseHex(text)
              setHexText({ text, value: hex ?? value })
              if (hex && hex !== value) onChange(hex)
            }}
          />
        </label>
      </div>
    </div>
  )
}
