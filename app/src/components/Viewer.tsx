import { useEffect, useRef, useState } from 'react'
import WebGL from 'three/addons/capabilities/WebGL.js'
import type { ArDebugInfo } from '../ar/arSession'
import { arStatus, type ArState } from '../ar/arStatus'
import { arErrorMessage } from '../ar/support'
import type { CeramicModel, MaterialSettings } from '../types/ceramic'
import { downloadBlob, downloadName } from '../utils/download'
import type { CameraSync } from '../viewers/CameraSync'
import { ArStatusIcon } from './ArStatusIcon'
import { CeramicViewer } from '../viewers/CeramicViewer'

/**
 * Switches for testing AR on a phone: `?debug=1` shows what the session
 * sees and draws; `?cubo=1` adds a test cube in front of the phone;
 * `?camada=webgl` renders into a classic XRWebGLLayer.
 */
const arParams = new URLSearchParams(window.location.search)
const AR_DEBUG = arParams.has('debug')
const AR_TEST_CUBE = arParams.get('cubo') === '1'
const AR_WEBGL_LAYER = arParams.get('camada') === 'webgl'

/** The debug panel's lines. */
function debugLines(info: ArDebugInfo): string[] {
  const yesNo = (value: boolean) => (value ? 'sim' : 'não')
  const meters = (value: number | null) => (value === null ? '—' : `${value} m`)
  return [
    `frames: sessão ${info.sessionFrames} · app ${info.loopFrames} · desenhados ${info.frames}`,
    `camada: ${info.layer ?? '—'} (forçada webgl: ${yesNo(AR_WEBGL_LAYER)})`,
    `erro não capturado: ${info.uncaught ?? '—'}`,
    `rastreando: ${yesNo(info.tracking)} · acerto: ${yesNo(info.hit)} · superfície: ${yesNo(info.found)}`,
    `anel: ${meters(info.ringDistance)} do celular, ${meters(info.ringDrop)} abaixo`,
    `1º anel: ${info.firstRingMs === null ? '—' : `${info.firstRingMs} ms`}`,
    `visível: anel ${yesNo(info.reticleVisible)} · peça ${yesNo(info.modelVisible)} · cubo ${yesNo(AR_TEST_CUBE)}`,
    `draw calls: ${info.calls} · triângulos: ${info.triangles}`,
    `framebuffer: ${info.framebuffer ?? '—'} · modo: ${info.blendMode ?? '—'}`,
    `profundidade: ${info.depthRange ?? '—'}`,
    `erro WebGL: ${info.glError} · contexto perdido: ${yesNo(info.contextLost)}`,
    `recursos: ${info.features ?? '—'}`,
    `erro: ${info.error ?? '—'}`,
  ]
}

interface ViewerProps {
  model: CeramicModel
  material: MaterialSettings
  /** Shares camera movement with other viewers in the same sync. */
  cameraSync?: CameraSync
  /** Accessible name of the viewer, e.g. "Variante A". */
  label?: string
  /** Shows the "Ver em AR" button (the browser supports immersive AR). */
  arSupported?: boolean
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

  // A tap on "Sair do AR" must not also place the piece behind it.
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
        { testCube: AR_TEST_CUBE, forceWebGLLayer: AR_WEBGL_LAYER },
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
      ? [model.id, label.replace(/^Variante\s*/, '')]
      : [model.id]
    viewer.captureImage().then((blob) => {
      if (blob) downloadBlob(blob, downloadName(parts, 'png'))
    })
  }

  const status = arStatus(ar, { surfaceFound, noSurfaceTap: noSurface })
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
        <div className="viewer-actions">
          {arSupported && (
            <button
              type="button"
              className="viewer-button viewer-ar"
              disabled={ar !== 'off'}
              onClick={startAr}
            >
              {ar === 'off' ? (
                'Ver em AR'
              ) : (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Abrindo AR…
                </>
              )}
            </button>
          )}
          <button
            type="button"
            className="viewer-button viewer-icon"
            disabled={ar !== 'off'}
            onClick={saveImage}
            aria-label="Salvar imagem"
            title="Salvar imagem (PNG)"
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
            className="viewer-button viewer-reset"
            onClick={() => viewerRef.current?.resetView()}
          >
            Reiniciar vista
          </button>
        </div>
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
          Sair do AR
        </button>
      </div>
    </div>
  )
}
