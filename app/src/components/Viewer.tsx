import { useEffect, useRef, useState } from 'react'
import WebGL from 'three/addons/capabilities/WebGL.js'
import type { CeramicModel, MaterialSettings } from '../types/ceramic'
import type { CameraSync } from '../viewers/CameraSync'
import { CeramicViewer } from '../viewers/CeramicViewer'

interface ViewerProps {
  model: CeramicModel
  material: MaterialSettings
  /** Shares camera movement with other viewers in the same sync. */
  cameraSync?: CameraSync
  /** Accessible name of the viewer, e.g. "Variante A". */
  label?: string
}

/** Outcome of the latest finished load. */
interface LoadResult {
  modelId: string
  error?: string
}

export function Viewer({ model, material, cameraSync, label }: ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<CeramicViewer | null>(null)
  const [webglAvailable] = useState(() => WebGL.isWebGL2Available())
  const [result, setResult] = useState<LoadResult | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !webglAvailable) return
    const viewer = new CeramicViewer(container)
    viewerRef.current = viewer
    const removeFromSync = cameraSync?.add(viewer)
    return () => {
      removeFromSync?.()
      viewer.dispose()
      viewerRef.current = null
    }
  }, [webglAvailable, cameraSync])

  // Runs after the effect above, so the viewer already exists.
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    let cancelled = false
    viewer.setModel(model).then(
      () => !cancelled && setResult({ modelId: model.id }),
      () =>
        !cancelled &&
        setResult({
          modelId: model.id,
          error: `Não foi possível carregar o modelo "${model.name}".`,
        }),
    )
    return () => {
      cancelled = true
    }
  }, [model])

  useEffect(() => {
    viewerRef.current?.setMaterial(material)
  }, [material])

  const loading = result?.modelId !== model.id
  const error = webglAvailable
    ? !loading && result?.error
    : 'Seu navegador não suporta WebGL, necessário para o visualizador 3D.'

  return (
    <div
      className="viewer"
      ref={containerRef}
      role={label ? 'group' : undefined}
      aria-label={label}
    >
      {error ? (
        <p className="viewer-status viewer-error" role="alert">
          {error}
        </p>
      ) : loading ? (
        <p className="viewer-status" role="status">
          Carregando…
        </p>
      ) : (
        <button
          type="button"
          className="viewer-reset"
          onClick={() => viewerRef.current?.resetView()}
        >
          Reiniciar vista
        </button>
      )}
    </div>
  )
}
