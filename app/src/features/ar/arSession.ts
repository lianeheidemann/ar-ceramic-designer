import {
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
  Vector3,
  type Camera,
  type Object3D,
  type Scene,
  type WebGLRenderer,
} from 'three'
import {
  DEBUG_INTERVAL_MS,
  describeError,
  describeUncaught,
  emptyDebugInfo,
  renderInfo,
  round,
  type ArDebugInfo,
} from './arDebug'
import { hideProjectionLayers } from './projectionLayers'

export interface ArSessionOptions {
  renderer: WebGLRenderer
  scene: Scene
  camera: Camera
  /** Placed at real size (the scene is in meters) where the user taps. */
  model: Object3D
  /** Element shown over the camera image (DOM Overlay), when supported. */
  overlay: HTMLElement
  /** The session is open; the piece is being prepared (shaders compiling). */
  onPreparing: () => void
  onPlaced: () => void
  /** A tap on a placed piece: the ring is back to choose a new spot. */
  onMoveStart: () => void
  /** The user tapped while no surface was detected under the ring. */
  onNoSurface: () => void
  /** A surface under the screen center was found (true) or lost (false). */
  onSurfaceChange: (found: boolean) => void
  /** Called once the session has ended and its resources are released. */
  onEnd: () => void
  /** Called a few times per second with what the session sees and draws. */
  onDebug?: (info: ArDebugInfo) => void
  /**
   * Shows a test cube 50 cm in front of where the phone was when AR
   * started, whatever the hit test finds: tells a rendering problem apart
   * from a placement problem on a real device.
   */
  testCube?: boolean
  /**
   * Lets Three.js render into a WebXR Layers projection layer, which it
   * picks whenever the browser has one. Off by default: in Chrome's AR on
   * the Galaxy S23 Ultra, nothing drawn into it showed over the camera
   * (draw calls went through, the screen stayed empty). Only for testing.
   */
  projectionLayer?: boolean
}

export interface ArSessionHandle {
  end: () => void
  /** Handles a tap on the DOM overlay (ignored if the overlay is not in use). */
  tapOverlay: () => void
}

/**
 * placing: choosing the first spot · placed: piece shown, ring hidden ·
 * moving: piece shown, ring back to choose a new spot.
 */
type PlacementMode = 'placing' | 'placed' | 'moving'

/**
 * Hit tests drop out for a few frames all the time while the phone moves.
 * A surface counts as lost only after this long without a hit; meanwhile
 * the ring stays at the last hit, so the ring and messages do not flicker.
 */
export const SURFACE_LOST_AFTER_MS = 800

/**
 * Starts an immersive AR session: a ring follows the detected surface
 * under the screen center (hit test) and a tap places the model there.
 * Resolves once the piece is ready to be placed.
 */
export async function startArSession({
  renderer,
  scene,
  camera,
  model,
  overlay,
  onPreparing,
  onPlaced,
  onMoveStart,
  onNoSurface,
  onSurfaceChange,
  onEnd,
  onDebug,
  testCube = false,
  projectionLayer = false,
}: ArSessionOptions): Promise<ArSessionHandle> {
  if (!navigator.xr) {
    throw new DOMException('WebXR unavailable', 'NotSupportedError')
  }
  const session = await navigator.xr.requestSession('immersive-ar', {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['dom-overlay'],
    domOverlay: { root: overlay },
  })

  const reticle = new Mesh(
    new RingGeometry(0.06, 0.075, 48).rotateX(-Math.PI / 2),
    new MeshBasicMaterial({ color: '#ffffff' }),
  )
  reticle.matrixAutoUpdate = false
  reticle.visible = false

  // Unlit and never culled: if this does not show, nothing 3D can.
  const cube = testCube
    ? new Mesh(
        new BoxGeometry(0.1, 0.1, 0.1),
        new MeshBasicMaterial({ color: '#ff00ff' }),
      )
    : undefined
  if (cube) {
    cube.position.set(0, 0, -0.5)
    cube.frustumCulled = false
  }

  const savedPosition = model.position.clone()
  const savedVisible = model.visible
  let hitTestSource: XRHitTestSource | undefined
  let mode: PlacementMode = 'placing'
  /** Whether a surface was detected under the ring in the last frame. */
  let surfaceFound = false
  let lastHitTime = -Infinity
  /**
   * With a DOM overlay, every tap arrives twice: as a click on the overlay
   * and as an XR "select" (on the S23 Ultra often hundreds of ms apart).
   * Only one path is used per session so a tap always counts once.
   */
  let overlayActive = false

  // Pieces are rotationally symmetric, so only the position matters.
  const handleTap = () => {
    if (mode === 'placed') {
      mode = 'moving'
      onMoveStart()
      return
    }
    if (!surfaceFound) {
      onNoSurface()
      return
    }
    model.position.setFromMatrixPosition(reticle.matrix)
    model.visible = true
    mode = 'placed'
    reticle.visible = false
    onPlaced()
  }

  let firstFrameTime: number | undefined
  const debug = emptyDebugInfo()
  const reportError = (error: unknown) => {
    debug.error ??= describeError(error)
  }

  const onUncaught = (event: ErrorEvent | PromiseRejectionEvent) => {
    debug.uncaught ??= describeUncaught(event)
  }
  let debugTimer: ReturnType<typeof setInterval> | undefined
  let sessionFrameId: number | undefined
  /** Starts the panel updates; they do not depend on the frame loop. */
  const startDebug = () => {
    if (!onDebug) return
    window.addEventListener('error', onUncaught)
    window.addEventListener('unhandledrejection', onUncaught)
    const countFrame = () => {
      debug.sessionFrames++
      sessionFrameId = session.requestAnimationFrame(countFrame)
    }
    sessionFrameId = session.requestAnimationFrame?.(countFrame)
    onDebug(collectDebug())
    debugTimer = setInterval(() => onDebug(collectDebug()), DEBUG_INTERVAL_MS)
  }
  const stopDebug = () => {
    clearInterval(debugTimer)
    if (sessionFrameId !== undefined) {
      session.cancelAnimationFrame(sessionFrameId)
    }
    window.removeEventListener('error', onUncaught)
    window.removeEventListener('unhandledrejection', onUncaught)
  }

  const cleanUp = () => {
    stopDebug()
    hitTestSource?.cancel()
    session.removeEventListener('select', onSelect)
    scene.remove(reticle)
    reticle.geometry.dispose()
    reticle.material.dispose()
    if (cube) {
      scene.remove(cube)
      cube.geometry.dispose()
      cube.material.dispose()
    }
    model.position.copy(savedPosition)
    model.visible = savedVisible
    onEnd()
  }
  const onSelect = () => {
    if (!overlayActive) handleTap()
  }
  session.addEventListener('end', cleanUp, { once: true })

  try {
    renderer.xr.enabled = true
    renderer.xr.setReferenceSpaceType('local')
    const restoreLayers = projectionLayer ? undefined : hideProjectionLayers()
    try {
      await renderer.xr.setSession(session)
    } finally {
      restoreLayers?.()
    }
    startDebug()
    overlayActive = Boolean(session.domOverlayState)
    onPreparing()
    const viewerSpace = await session.requestReferenceSpace('viewer')
    hitTestSource = await session.requestHitTestSource?.({ space: viewerSpace })
    if (!hitTestSource) {
      throw new DOMException('Hit test unavailable', 'NotSupportedError')
    }
    // Compile the piece's shaders now, while it is still visible: otherwise
    // the first render after the tap compiles them and the piece shows up
    // late on phones.
    model.visible = true
    await renderer.compileAsync(model, camera, scene).catch(() => {})
  } catch (error) {
    stopDebug()
    session.removeEventListener('end', cleanUp)
    model.visible = savedVisible
    await session.end().catch(() => {})
    throw error
  }

  model.visible = false
  scene.add(reticle)
  if (cube) scene.add(cube)
  // Without a DOM overlay, taps arrive only as XR "select" events. Listen on
  // the session itself; Three.js controllers do not get screen taps reliably.
  session.addEventListener('select', onSelect)

  renderer.setAnimationLoop((time, frame) => {
    firstFrameTime ??= time
    if (frame) debug.loopFrames++
    // A failing frame must not stop the session: keep rendering.
    try {
      const referenceSpace = renderer.xr.getReferenceSpace()
      const pose =
        frame && hitTestSource && referenceSpace
          ? frame.getHitTestResults(hitTestSource)[0]?.getPose(referenceSpace)
          : undefined
      if (pose) {
        lastHitTime = time
        reticle.matrix.fromArray(pose.transform.matrix)
      }
      const found = time - lastHitTime < SURFACE_LOST_AFTER_MS
      if (found !== surfaceFound) {
        surfaceFound = found
        onSurfaceChange(surfaceFound)
      }
      reticle.visible = surfaceFound && mode !== 'placed'
      // Only XR frames say anything about tracking and hits.
      if (onDebug && frame) {
        debug.hit = Boolean(pose)
        if (found) debug.firstRingMs ??= Math.round(time - firstFrameTime)
        const viewer =
          frame && referenceSpace
            ? frame.getViewerPose(referenceSpace)
            : undefined
        debug.tracking = Boolean(viewer && !viewer.emulatedPosition)
        if (viewer && found) {
          const { x, y, z } = viewer.transform.position
          const ring = new Vector3().setFromMatrixPosition(reticle.matrix)
          debug.ringDistance = round(ring.distanceTo(new Vector3(x, y, z)))
          debug.ringDrop = round(y - ring.y)
        }
      }
    } catch (error) {
      reportError(error)
    }
    try {
      renderer.render(scene, camera)
      if (frame) debug.frames++
    } catch (error) {
      reportError(error)
    }
  })

  /** Fills in the rendering side of `debug`. */
  function collectDebug(): ArDebugInfo {
    try {
      Object.assign(debug, renderInfo(renderer, session), {
        found: surfaceFound,
        reticleVisible: reticle.visible,
        modelVisible: model.visible,
      })
    } catch (error) {
      reportError(error)
    }
    return { ...debug }
  }

  return {
    end: () => {
      session.end().catch(() => {})
    },
    tapOverlay: () => {
      if (overlayActive) handleTap()
    },
  }
}
