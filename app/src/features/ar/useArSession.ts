import { useRef, useState, type RefObject } from 'react'
import type { CeramicViewer } from '../viewer/CeramicViewer'
import type { ArDebugInfo } from './arDebug'
import { arStatus, type ArState } from './arStatus'
import { arErrorMessage } from './support'
import { AR_DEBUG, AR_PROJECTION_LAYER, AR_TEST_CUBE } from './testSwitches'

/** State of a viewer's AR session: what the overlay shows, and how to start. */
export function useArSession(viewerRef: RefObject<CeramicViewer | null>) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [ar, setAr] = useState<ArState>('off')
  const [arError, setArError] = useState<string | null>(null)
  const [noSurface, setNoSurface] = useState(false)
  const [surfaceFound, setSurfaceFound] = useState(false)
  /** Whether any surface was found in this session (ends the intro hint). */
  const [surfaceSeen, setSurfaceSeen] = useState(false)
  const [debugInfo, setDebugInfo] = useState<ArDebugInfo | null>(null)
  const noSurfaceTimer = useRef<number | undefined>(undefined)

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

  return {
    overlayRef,
    ar,
    arError,
    status: arStatus(ar, { surfaceFound, noSurfaceTap: noSurface }),
    surfaceSeen,
    debugInfo,
    startAr,
  }
}
