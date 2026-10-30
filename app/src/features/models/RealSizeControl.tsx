import { useId, useState } from 'react'
import type { DimensionsMm } from '../../shared/types'
import {
  MAX_HEIGHT_CM as MAX_CM,
  MIN_HEIGHT_CM as MIN_CM,
  formatCm,
} from '../../shared/units'

interface RealSizeControlProps {
  /** Size from the catalog or as measured in the file. */
  originalDimensionsMm: DimensionsMm
  /** Height shown in the viewer and AR, in millimeters. */
  heightMm: number
  onChange: (heightMm: number) => void
}

/**
 * Real height of the piece: files from AI generators come scaled to about
 * 1 m, and any piece can be tried at another size; the piece follows.
 */
export function RealSizeControl({
  originalDimensionsMm,
  heightMm,
  onChange,
}: RealSizeControlProps) {
  const id = useId()
  // Kept as text while typing ("7," or an empty field are fine midway),
  // and taken from `heightMm` again when it changes from outside.
  const [draft, setDraft] = useState({ text: formatCm(heightMm), heightMm })
  if (draft.heightMm !== heightMm) {
    setDraft({ text: formatCm(heightMm), heightMm })
  }

  function commit(value: string) {
    const cm = Number(value.replace(',', '.'))
    const valid = value !== '' && cm >= MIN_CM && cm <= MAX_CM
    setDraft({ text: value, heightMm: valid ? cm * 10 : heightMm })
    if (valid) onChange(cm * 10)
  }

  const ratio = heightMm / originalDimensionsMm.height
  const width = Math.round(originalDimensionsMm.width * ratio)
  const changed = Math.abs(heightMm - originalDimensionsMm.height) >= 1

  return (
    <section className="controls-section">
      <h2>Real size</h2>
      <label className="control-row" htmlFor={`${id}-height`}>
        <span className="control-label">Height (cm)</span>
        <input
          id={`${id}-height`}
          className="size-input"
          type="number"
          inputMode="decimal"
          min={MIN_CM}
          max={MAX_CM}
          step={0.1}
          value={draft.text}
          onChange={(event) => commit(event.target.value)}
        />
      </label>
      <p className="controls-note">
        Piece: ⌀ {width} × {Math.round(heightMm)} mm. Original: ⌀{' '}
        {originalDimensionsMm.width} × {originalDimensionsMm.height} mm.
      </p>
      {changed && (
        <button
          type="button"
          className="reset-material"
          onClick={() => onChange(originalDimensionsMm.height)}
        >
          Original size
        </button>
      )}
    </section>
  )
}
