import type { CeramicModel } from '../../shared/types'
import type { ModelInfo } from '../viewer/modelInfo'
import { formatBytes, formatTriangles } from './importModel'

interface ModelDetailsProps {
  model: CeramicModel
  /** Whether the user imported it (it lasts until the page reloads). */
  imported: boolean
  /** Known once the viewer has loaded the model. */
  info?: ModelInfo
}

/** File and mesh facts about the selected model, collapsed by default. */
export function ModelDetails({ model, imported, info }: ModelDetailsProps) {
  const source =
    model.source.kind === 'lathe'
      ? 'Generated in code'
      : imported
        ? 'Imported (until the page reloads)'
        : 'Default model'
  const simplified = info && info.triangles < info.fileTriangles
  return (
    <details className="controls-section model-details">
      <summary>Details</summary>
      <dl>
        <dt>Source</dt>
        <dd>{source}</dd>
        {model.fileBytes !== undefined && (
          <>
            <dt>File</dt>
            <dd>{formatBytes(model.fileBytes)}</dd>
          </>
        )}
        <dt>Mesh</dt>
        <dd>
          {info
            ? simplified
              ? `${formatTriangles(info.fileTriangles)}, shown with ${formatTriangles(info.triangles)}`
              : formatTriangles(info.triangles)
            : '…'}
        </dd>
        <dt>Textures</dt>
        <dd>
          {info
            ? info.textures
              ? `${info.textures} · up to ${info.maxTextureSize} px`
              : 'None'
            : '…'}
        </dd>
      </dl>
    </details>
  )
}
