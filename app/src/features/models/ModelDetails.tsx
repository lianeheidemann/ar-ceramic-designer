import { ChevronDownIcon, DocumentIcon } from '../../shared/icons'
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
  const mesh = info
    ? simplified
      ? `${formatTriangles(info.fileTriangles)}, shown with ${formatTriangles(info.triangles)}`
      : formatTriangles(info.triangles)
    : '…'
  const textures = info
    ? info.textures
      ? `${info.textures} · up to ${info.maxTextureSize} px`
      : 'None'
    : '…'
  const rows: [string, string][] = [
    ['Source', source],
    ...(model.fileBytes !== undefined
      ? [['File', formatBytes(model.fileBytes)] as [string, string]]
      : []),
    ['Mesh', mesh],
    ['Textures', textures],
  ]
  return (
    <details className="controls-section model-details">
      <summary className="section-title">
        <DocumentIcon />
        Details
        <ChevronDownIcon className="details-chevron" />
      </summary>
      <dl className="details-card">
        {rows.map(([term, value]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
