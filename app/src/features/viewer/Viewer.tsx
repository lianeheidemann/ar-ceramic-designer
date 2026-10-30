import { useEffect, useRef, useState } from 'react'
import WebGL from 'three/addons/capabilities/WebGL.js'
import { ArOverlay } from '../ar/ArOverlay'
import { AR_DEBUG } from '../ar/testSwitches'
import { useArSession } from '../ar/useArSession'
import { downloadBlob, downloadName } from '../settings/download'
import type { CeramicModel, MaterialSettings } from '../../shared/types'
import type { CameraSync } from './CameraSync'
import { CeramicViewer, type ViewerStats } from './CeramicViewer'
import { statsLines } from './viewerDebug'
import { ViewerActions } from './ViewerActions'

interface ViewerProps {
  model: CeramicModel
  material: MaterialSettings
  /** Shares camera movement with other viewers in the same sync. */
  cameraSync?: CameraSync
  /** Accessible name of the viewer, e.g. "Variant A". */
  label?: string
  /** Shows the "View in AR" button (the browser supports immersive AR). */
  arSupported?: boolean
  /** Uniform scale, e.g. to give an imported piece its real size. */
  scale?: number
  /** Height the piece is shown at; with `onHeightChange`, AR offers − / +. */
  heightMm?: number
  onHeightChange?: (heightMm: number) => void
}

/** Outcome of the latest finished load. */
interface LoadResult {
  modelId: string
  error?: string
}

export function Viewer({
  model,
  material,
  cameraSync,
  label,
  arSupported = false,
  scale = 1,
  heightMm,
  onHeightChange,
}: ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<CeramicViewer | null>(null)
  const { overlayRef, ar, arError, status, surfaceSeen, debugInfo, startAr } =
    useArSession(viewerRef)
  const [webglAvailable] = useState(() => WebGL.isWebGL2Available())
  const [result, setResult] = useState<LoadResult | null>(null)
  /** Bumped to rebuild the viewer, e.g. after the GPU context was lost. */
  const [instance, setInstance] = useState(0)
  /** Bumped to load the model again after a failure. */
  const [retry, setRetry] = useState(0)
  const [contextLost, setContextLost] = useState(false)
  const [stats, setStats] = useState<ViewerStats | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !webglAvailable) return
    const viewer = new CeramicViewer(container)
    viewerRef.current = viewer
    const removeFromSync = cameraSync?.add(viewer)
    const removeContextListener = viewer.onContextChange(setContextLost)
    return () => {
      removeContextListener()
      removeFromSync?.()
      viewer.dispose()
      viewerRef.current = null
    }
  }, [webglAvailable, cameraSync, instance])

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
          error: `Could not load the model "${model.name}".`,
        }),
    )
    return () => {
      cancelled = true
    }
  }, [model, instance, retry])

  // Also after a rebuild: a new viewer starts without the custom material.
  useEffect(() => {
    viewerRef.current?.setMaterial(material)
  }, [material, instance])

  useEffect(() => {
    viewerRef.current?.setScale(scale)
  }, [scale, instance])

  useEffect(() => {
    if (!AR_DEBUG || ar !== 'off') return
    const timer = window.setInterval(() => {
      const viewer = viewerRef.current
      if (viewer) setStats(viewer.getStats())
    }, 500)
    return () => window.clearInterval(timer)
  }, [ar, instance])

  function saveImage() {
    const viewer = viewerRef.current
    if (!viewer) return
    const parts = label
      ? [model.id, label.replace(/^Variant\s*/, '')]
      : [model.id]
    viewer.captureImage().then((blob) => {
      if (blob) downloadBlob(blob, downloadName(parts, 'png'))
    })
  }

  function rebuildViewer() {
    setContextLost(false)
    setResult(null)
    setInstance((value) => value + 1)
  }

  function retryLoad() {
    setResult(null)
    setRetry((value) => value + 1)
  }

  const loading = result?.modelId !== model.id
  const error = webglAvailable
    ? !loading && result?.error
    : 'Your browser does not support WebGL, which the 3D viewer needs.'

  return (
    <div
      className="viewer"
      ref={containerRef}
      role={label ? 'group' : undefined}
      aria-label={label}
    >
      {contextLost ? (
        <div className="viewer-status viewer-error" role="alert">
          <p>
            The system stopped the 3D viewer (low video memory). Trying to
            restore it…
          </p>
          <button
            type="button"
            className="viewer-button"
            onClick={rebuildViewer}
          >
            Reload viewer
          </button>
        </div>
      ) : error ? (
        <div className="viewer-status viewer-error" role="alert">
          <p>{error}</p>
          {webglAvailable && (
            <button type="button" className="viewer-button" onClick={retryLoad}>
              Try again
            </button>
          )}
        </div>
      ) : loading ? (
        <p className="viewer-status" role="status">
          Loading…
        </p>
      ) : (
        <ViewerActions
          ar={ar}
          arSupported={arSupported}
          onSaveImage={saveImage}
          onResetView={() => viewerRef.current?.resetView()}
          onStartAr={startAr}
        />
      )}
      {AR_DEBUG && stats && ar === 'off' && (
        <pre className="viewer-debug">{statsLines(stats).join('\n')}</pre>
      )}
      {arError && (
        <p className="viewer-ar-error" role="alert">
          {arError}
        </p>
      )}
      <ArOverlay
        overlayRef={overlayRef}
        ar={ar}
        status={status}
        surfaceSeen={surfaceSeen}
        debugInfo={debugInfo}
        heightMm={heightMm}
        onHeightChange={onHeightChange}
        onTap={() => viewerRef.current?.placeAr()}
        onRotate={(radians) => viewerRef.current?.rotateAr(radians)}
        onExit={() => viewerRef.current?.endAr()}
      />
    </div>
  )
}
