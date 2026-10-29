import { useEffect, useRef, useState } from 'react'
import WebGL from 'three/addons/capabilities/WebGL.js'
import type { ArDebugInfo } from '../ar/arSession'
import { arStatus, type ArState } from '../ar/arStatus'
import { arErrorMessage } from '../ar/support'
import type { CeramicModel, MaterialSettings } from '../types/ceramic'
import { downloadBlob, downloadName } from '../utils/download'
import type { CameraSync } from '../viewers/CameraSync'
import { ArStatusIcon } from './ArStatusIcon'
import { CeramicViewer, type ViewerStats } from '../viewers/CeramicViewer'

/**
 * Switches for testing AR on a phone: `?debug=1` shows what the session
 * sees and draws; `?cube=1` adds a test cube in front of the phone;
 * `?layer=projection` lets Three.js render into a WebXR Layers projection
 * layer (shows nothing on the S23 Ultra; to reproduce that only).
 */
const arParams = new URLSearchParams(window.location.search)
const AR_DEBUG = arParams.has('debug')
const AR_TEST_CUBE = arParams.get('cube') === '1'
const AR_PROJECTION_LAYER = arParams.get('layer') === 'projection'

/** The 3D viewer's debug lines (`?debug=1`, outside AR). */
function statsLines(stats: ViewerStats): string[] {
  return [
    `fps: ${stats.fps} · drawn: ${stats.framesRendered}`,
    `draw calls: ${stats.drawCalls} · triangles: ${stats.triangles}`,
    `GPU memory: geometries ${stats.geometries} · textures ${stats.textures}`,
    `pixel ratio: ${stats.pixelRatio} · model: ${stats.loadMs ?? '—'} ms`,
    `camera: ${stats.azimuthDeg}° · damping: ${stats.damping ? 'yes' : 'no'}`,
  ]
}

/** The AR debug panel's lines. */
function debugLines(info: ArDebugInfo): string[] {
  const yesNo = (value: boolean) => (value ? 'yes' : 'no')
  const meters = (value: number | null) => (value === null ? '—' : `${value} m`)
  return [
    `frames: session ${info.sessionFrames} · app ${info.loopFrames} · drawn ${info.frames}`,
    `layer: ${info.layer ?? '—'}`,
    `uncaught error: ${info.uncaught ?? '—'}`,
    `tracking: ${yesNo(info.tracking)} · hit: ${yesNo(info.hit)} · surface: ${yesNo(info.found)}`,
    `ring: ${meters(info.ringDistance)} from the phone, ${meters(info.ringDrop)} below`,
    `first ring: ${info.firstRingMs === null ? '—' : `${info.firstRingMs} ms`}`,
    `visible: ring ${yesNo(info.reticleVisible)} · piece ${yesNo(info.modelVisible)} · cube ${yesNo(AR_TEST_CUBE)}`,
    `draw calls: ${info.calls} · triangles: ${info.triangles}`,
    `framebuffer: ${info.framebuffer ?? '—'} · mode: ${info.blendMode ?? '—'}`,
    `depth: ${info.depthRange ?? '—'}`,
    `WebGL error: ${info.glError} · context lost: ${yesNo(info.contextLost)}`,
    `features: ${info.features ?? '—'}`,
    `error: ${info.error ?? '—'}`,
  ]
}

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
}: ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const exitArRef = useRef<HTMLButtonElement>(null)
  const [ar, setAr] = useState<ArState>('off')
  const [arError, setArError] = useState<string | null>(null)
  const [noSurface, setNoSurface] = useState(false)
  const [surfaceFound, setSurfaceFound] = useState(false)
  /** Whether any surface was found in this session (ends the intro hint). */
  const [surfaceSeen, setSurfaceSeen] = useState(false)
  const [debugInfo, setDebugInfo] = useState<ArDebugInfo | null>(null)
  const noSurfaceTimer = useRef<number | undefined>(undefined)
  const viewerRef = useRef<CeramicViewer | null>(null)
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

  // A tap on "Exit AR" must not also place the piece behind it.
  useEffect(() => {
    const button = exitArRef.current
    if (!button) return
    const keepTap = (event: Event) => event.preventDefault()
    button.addEventListener('beforexrselect', keepTap)
    return () => button.removeEventListener('beforexrselect', keepTap)
  }, [])

  function showNoSurface() {
    setNoSurface(true)
    window.clearTimeout(noSurfaceTimer.current)
    noSurfaceTimer.current = window.setTimeout(() => setNoSurface(false), 2500)
  }

  function startAr() {
    const viewer = viewerRef.current
    const overlay = overlayRef.current
    if (!viewer || !overlay) return
    setArError(null)
    setSurfaceFound(false)
    setSurfaceSeen(false)
    setDebugInfo(null)
    setAr('starting')
    viewer
      .startAr(
        overlay,
        {
          onPreparing: () => setAr('preparing'),
          onPlaced: () => {
            setNoSurface(false)
            setAr('placed')
          },
          onMoveStart: () => setAr('moving'),
          onNoSurface: showNoSurface,
          onSurfaceChange: (found) => {
            setSurfaceFound(found)
            if (found) setSurfaceSeen(true)
          },
          onEnd: () => setAr('off'),
          onDebug: AR_DEBUG ? setDebugInfo : undefined,
        },
        { testCube: AR_TEST_CUBE, projectionLayer: AR_PROJECTION_LAYER },
      )
      .then(
        () =>
          setAr((state) =>
            state === 'starting' || state === 'preparing' ? 'placing' : state,
          ),
        (error: unknown) => {
          setAr('off')
          setArError(arErrorMessage(error))
        },
      )
  }

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

  const status = arStatus(ar, { surfaceFound, noSurfaceTap: noSurface })
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
        <div className="viewer-actions">
          <button
            type="button"
            className="viewer-button viewer-icon"
            disabled={ar !== 'off'}
            onClick={saveImage}
            aria-label="Save image"
            title="Save image (PNG)"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 8h3l2-3h6l2 3h3v11H4Z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          </button>
          <button
            type="button"
            className="viewer-button viewer-icon"
            onClick={() => viewerRef.current?.resetView()}
            aria-label="Reset view"
            title="Reset view"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
          {/* Last: by the right edge, where the thumb rests. */}
          {arSupported && (
            <button
              type="button"
              className="viewer-button viewer-ar"
              disabled={ar !== 'off'}
              onClick={startAr}
            >
              {ar === 'off' ? (
                'View in AR'
              ) : (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Opening AR…
                </>
              )}
            </button>
          )}
        </div>
      )}
      {AR_DEBUG && stats && ar === 'off' && (
        <pre className="viewer-debug">{statsLines(stats).join('\n')}</pre>
      )}
      {arError && (
        <p className="viewer-ar-error" role="alert">
          {arError}
        </p>
      )}
      <div
        className="ar-overlay"
        ref={overlayRef}
        hidden={ar === 'off' || ar === 'starting'}
        // Second path for taps besides the XR "select" event.
        onClick={() => viewerRef.current?.placeAr()}
      >
        <p className="ar-hint" role="status">
          {status && (
            <>
              <ArStatusIcon name={status.icon} />
              {status.text}
            </>
          )}
        </p>
        {status?.icon === 'scanning' && !surfaceSeen && (
          // Large hint while ARCore looks for the first surface (can take
          // seconds); later dropouts only change the small message.
          <div className="ar-scan" aria-hidden="true">
            <ArStatusIcon name="scanning" />
          </div>
        )}
        {AR_DEBUG && debugInfo && (
          <pre className="ar-debug">{debugLines(debugInfo).join('\n')}</pre>
        )}
        <button
          ref={exitArRef}
          type="button"
          className="ar-exit"
          onClick={(event) => {
            event.stopPropagation()
            viewerRef.current?.endAr()
          }}
        >
          Exit AR
        </button>
      </div>
    </div>
  )
}
