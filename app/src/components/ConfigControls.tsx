import { useRef, useState } from 'react'
import type { CeramicModel, MaterialSettings } from '../types/ceramic'
import { createConfig, parseConfig, type CeramicConfig } from '../utils/config'
import { downloadBlob, downloadName } from '../utils/download'
import { importGlb, isGlb } from '../utils/importModel'

interface ConfigControlsProps {
  model: CeramicModel
  /** B is included only while comparing. */
  variants: { A: MaterialSettings; B?: MaterialSettings }
  onImport: (config: CeramicConfig) => void
  /** A 3D model (.glb) opened with the same button, and its starting height. */
  onImportModel: (model: CeramicModel, realHeightMm?: number) => void
}

type Message = { kind: 'done' | 'error'; text: string }

export function ConfigControls({
  model,
  variants,
  onImport,
  onImportModel,
}: ConfigControlsProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<Message | null>(null)

  function exportConfig() {
    const json = JSON.stringify(createConfig(model, variants), null, 2)
    downloadBlob(
      new Blob([json], { type: 'application/json' }),
      downloadName([model.id], 'json'),
    )
    setMessage(null)
  }

  /** Tells a .glb model from a .json configuration by its first bytes. */
  async function importFile(file: File) {
    const header = await file.slice(0, 4).arrayBuffer()
    if (isGlb(header)) await importModel(file)
    else await importConfig(file)
  }

  async function importModel(file: File) {
    setMessage({ kind: 'done', text: `Reading the model "${file.name}"…` })
    const result = await importGlb(file)
    if (!result.ok) {
      setMessage({ kind: 'error', text: result.error })
      return
    }
    onImportModel(result.model, result.realHeightMm)
    setMessage({
      kind: 'done',
      text: [`Model "${result.model.name}" imported.`, result.warning]
        .filter(Boolean)
        .join(' '),
    })
  }

  async function importConfig(file: File) {
    const result = parseConfig(await file.text())
    if (result.ok) {
      onImport(result.config)
      setMessage({
        kind: 'done',
        text: `Settings "${file.name}" applied.`,
      })
    } else {
      setMessage({ kind: 'error', text: result.error })
    }
  }

  return (
    <div>
      <div className="config-actions">
        <button type="button" className="config-button" onClick={exportConfig}>
          Export (.json)
        </button>
        <button
          type="button"
          className="config-button"
          onClick={() => fileRef.current?.click()}
        >
          Import
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json,model/gltf-binary,.glb"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          // Clear so choosing the same file again still fires `change`.
          event.target.value = ''
          if (file) void importFile(file)
        }}
      />
      <p className="config-message controls-note">
        Import takes saved settings (.json) or a 3D model (.glb).
      </p>
      {message && (
        <p
          className={`config-message ${message.kind === 'error' ? 'config-error' : 'controls-note'}`}
          role={message.kind === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </p>
      )}
    </div>
  )
}
