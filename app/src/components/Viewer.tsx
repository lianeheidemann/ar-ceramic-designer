import { useEffect, useRef, useState } from 'react'
import WebGL from 'three/addons/capabilities/WebGL.js'
import { arErrorMessage } from '../ar/support'
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
  /** Shows the "Ver em AR" button (the browser supports immersive AR). */
  arSupported?: boolean
}

type ArState =
  'off' | 'starting' | 'preparing' | 'placing' | 'placed' | 'moving'

const arHints: Record<'placing' | 'placed' | 'moving', string> = {
  placing: 'Aponte para o chão ou uma mesa e toque para posicionar a peça.',
  placed: 'Toque na tela para mover a peça.',
  moving: 'Aponte para o novo lugar e toque para colocar a peça.',
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
    setAr('starting')
    viewer
      .startAr(overlay, {
        onPreparing: () => setAr('preparing'),
        onPlaced: () => {
          setNoSurface(false)
          setAr('placed')
        },
        onMoveStart: () => setAr('moving'),
        onNoSurface: showNoSurface,
        onEnd: () => setAr('off'),
      })
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
          {ar === 'preparing' ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Preparando a peça…
            </>
          ) : noSurface ? (
            'Nenhuma superfície detectada — mova o celular devagar.'
          ) : ar === 'placing' || ar === 'placed' || ar === 'moving' ? (
            arHints[ar]
          ) : null}
        </p>
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
