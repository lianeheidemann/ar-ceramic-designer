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
}

/** Diagnostics for testing on a phone (`?debug=1`). */
export interface ArDebugInfo {
  /** The viewer pose is tracked (not emulated). */
  tracking: boolean
  /** A hit test result arrived in the last frame. */
  hit: boolean
  found: boolean
  /** Ring distance from the phone and how far below it, in meters. */
  ringDistance: number | null
  ringDrop: number | null
  /** Time from the first XR frame to the first ring, in ms. */
  firstRingMs: number | null
  reticleVisible: boolean
  modelVisible: boolean
  /** XR frames rendered so far. */
  frames: number
  /** Draw calls and triangles of the last frame. */
  calls: number
  triangles: number
  /** XR framebuffer size, e.g. `1440×3088`. */
  framebuffer: string | null
  blendMode: string | null
  depthRange: string | null
  /** Latest WebGL error code, 0 when none. */
  glError: number
  contextLost: boolean
  /** First error thrown in the frame loop, if any. */
  error: string | null
}

/** How often `onDebug` is called. */
const DEBUG_INTERVAL_MS = 250

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
}: ArSessionOptions): Promise<ArSessionHandle> {
  if (!navigator.xr) {
    throw new DOMException('WebXR indisponível', 'NotSupportedError')
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

  const cleanUp = () => {
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
    await renderer.xr.setSession(session)
    overlayActive = Boolean(session.domOverlayState)
    onPreparing()
    const viewerSpace = await session.requestReferenceSpace('viewer')
    hitTestSource = await session.requestHitTestSource?.({ space: viewerSpace })
    if (!hitTestSource) {
      throw new DOMException('Hit test indisponível', 'NotSupportedError')
    }
    // Compile the piece's shaders now, while it is still visible: otherwise
    // the first render after the tap compiles them and the piece shows up
    // late on phones.
    model.visible = true
    await renderer.compileAsync(model, camera, scene).catch(() => {})
  } catch (error) {
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

  let firstFrameTime: number | undefined
  let lastDebugTime = -Infinity
  const debug: ArDebugInfo = {
    tracking: false,
    hit: false,
    found: false,
    ringDistance: null,
    ringDrop: null,
    firstRingMs: null,
    reticleVisible: false,
    modelVisible: false,
    frames: 0,
    calls: 0,
    triangles: 0,
    framebuffer: null,
    blendMode: null,
    depthRange: null,
    glError: 0,
    contextLost: false,
    error: null,
  }
  const reportError = (error: unknown) => {
    debug.error ??= error instanceof Error ? error.message : String(error)
  }

  renderer.setAnimationLoop((time, frame) => {
    firstFrameTime ??= time
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
      if (onDebug) {
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
      debug.frames++
    } catch (error) {
      reportError(error)
    }
    if (onDebug && time - lastDebugTime >= DEBUG_INTERVAL_MS) {
      lastDebugTime = time
      onDebug(collectDebug())
    }
  })

  /** Fills in the rendering side of `debug`. */
  function collectDebug(): ArDebugInfo {
    try {
      const gl = renderer.getContext()
      const layer = renderer.xr.getBaseLayer()
      const { depthNear, depthFar } = session.renderState ?? {}
      Object.assign(debug, {
        found: surfaceFound,
        reticleVisible: reticle.visible,
        modelVisible: model.visible,
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        framebuffer:
          layer && 'framebufferWidth' in layer
            ? `${layer.framebufferWidth}×${layer.framebufferHeight}`
            : null,
        blendMode: session.environmentBlendMode ?? null,
        depthRange:
          depthNear === undefined
            ? null
            : `${round(depthNear)}–${round(depthFar)}`,
        glError: gl.getError(),
        contextLost: gl.isContextLost(),
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

/** Rounds to centimeters, enough for the debug panel. */
function round(meters: number): number {
  return Math.round(meters * 100) / 100
}
