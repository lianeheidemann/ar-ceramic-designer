import { useRef, useState } from 'react'
import type { CeramicModel } from '../../shared/types'
import { importGlb } from './importModel'

interface ModelImportProps {
  /** A model read from a .glb file, and its starting height. */
  onImport: (model: CeramicModel, realHeightMm?: number) => void
}

type Message = { kind: 'done' | 'error'; text: string }

/** Opens a .glb file from the device and adds it to the model list. */
export function ModelImport({ onImport }: ModelImportProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<Message | null>(null)

  async function importFile(file: File) {
    setMessage({ kind: 'done', text: `Reading the model "${file.name}"…` })
    const result = await importGlb(file)
    if (!result.ok) {
      setMessage({ kind: 'error', text: result.error })
      return
    }
    onImport(result.model, result.realHeightMm)
    setMessage({
      kind: 'done',
      text: [`Model "${result.model.name}" imported.`, result.warning]
        .filter(Boolean)
        .join(' '),
    })
  }

  return (
    <div className="model-import">
      <button
        type="button"
        className="import-button"
        onClick={() => fileRef.current?.click()}
      >
        Import .glb
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="model/gltf-binary,.glb"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          // Clear so choosing the same file again still fires `change`.
          event.target.value = ''
          if (file) void importFile(file)
        }}
      />
      {message && (
        <p
          className={`import-message ${message.kind === 'error' ? 'import-error' : 'controls-note'}`}
          role={message.kind === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </p>
      )}
    </div>
  )
}
