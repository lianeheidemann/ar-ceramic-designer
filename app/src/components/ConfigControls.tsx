import { useRef, useState } from 'react'
import type { CeramicModel, MaterialSettings } from '../types/ceramic'
import { createConfig, parseConfig, type CeramicConfig } from '../utils/config'
import { downloadBlob, downloadName } from '../utils/download'

interface ConfigControlsProps {
  model: CeramicModel
  /** B is included only while comparing. */
  variants: { A: MaterialSettings; B?: MaterialSettings }
  onImport: (config: CeramicConfig) => void
}

type Message = { kind: 'done' | 'error'; text: string }

export function ConfigControls({
  model,
  variants,
  onImport,
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

  async function importConfig(file: File) {
    const result = parseConfig(await file.text())
    if (result.ok) {
      onImport(result.config)
      setMessage({
        kind: 'done',
        text: `Configuração "${file.name}" aplicada.`,
      })
    } else {
      setMessage({ kind: 'error', text: result.error })
    }
  }

  return (
    <div>
      <div className="config-actions">
        <button type="button" className="config-button" onClick={exportConfig}>
          Exportar (.json)
        </button>
        <button
          type="button"
          className="config-button"
          onClick={() => fileRef.current?.click()}
        >
          Importar
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          // Clear so choosing the same file again still fires `change`.
          event.target.value = ''
          if (file) void importConfig(file)
        }}
      />
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
