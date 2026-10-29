import { useId, useState } from 'react'
import type { DimensionsMm } from '../types/ceramic'

interface RealSizeControlProps {
  /** Size as measured in the file. */
  fileDimensionsMm: DimensionsMm
  /** Height shown in the viewer and AR, in millimeters. */
  heightMm: number
  onChange: (heightMm: number) => void
}

const MIN_CM = 0.5
const MAX_CM = 300

const formatCm = (mm: number) => String(Math.round(mm) / 10)

/**
 * Real height of an imported piece: files from AI generators come scaled
 * to about 1 m, so the user types the actual height and the piece follows.
 */
export function RealSizeControl({
  fileDimensionsMm,
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

  const ratio = heightMm / fileDimensionsMm.height
  const width = Math.round(fileDimensionsMm.width * ratio)
  const changed = Math.abs(heightMm - fileDimensionsMm.height) >= 1

  return (
    <section className="controls-section">
      <h2>Tamanho real</h2>
      <label className="control-row" htmlFor={`${id}-height`}>
        <span className="control-label">Altura (cm)</span>
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
        Peça: ⌀ {width} × {Math.round(heightMm)} mm. No arquivo: ⌀{' '}
        {fileDimensionsMm.width} × {fileDimensionsMm.height} mm.
      </p>
      {changed && (
        <button
          type="button"
          className="reset-material"
          onClick={() => onChange(fileDimensionsMm.height)}
        >
          Usar o tamanho do arquivo
        </button>
      )}
    </section>
  )
}
