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
  /**
   * Lets Three.js render into a WebXR Layers projection layer, which it
   * picks whenever the browser has one. Off by default: in Chrome's AR on
   * the Galaxy S23 Ultra, nothing drawn into it showed over the camera
   * (draw calls went through, the screen stayed empty). Only for testing.
   */
  projectionLayer?: boolean
}

/** Diagnostics for testing on a phone (`?debug=1`). */
export interface ArDebugInfo {
  /** Frames the XR session delivered, counted apart from Three.js. */
  sessionFrames: number
  /**
   * Times this module's frame callback ran for an XR frame. Three.js also
   * calls it from the page's own animation loop, without one.
   */
  loopFrames: number
  /** Layer Three.js renders into. */
  layer: 'projection' | 'webgl' | null
  /** Features the session was granted. */
  features: string | null
  /** First uncaught error during the session, e.g. from inside Three.js. */
  uncaught: string | null
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
  /** XR frames rendered by this module so far. */
  frames: number
  /** Draw calls and triangles of the last frame. */
  calls: number
  triangles: number
  /** XR framebuffer or layer texture size, e.g. `1440×3088`. */
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
  projectionLayer = false,
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

  let firstFrameTime: number | undefined
  const debug: ArDebugInfo = {
    sessionFrames: 0,
    loopFrames: 0,
    layer: null,
    features: null,
    uncaught: null,
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
    debug.error ??= describeError(error)
  }

  const onUncaught = (event: ErrorEvent | PromiseRejectionEvent) => {
    if (debug.uncaught) return
    if ('reason' in event) {
      debug.uncaught = `(promise) ${describeError(event.reason)}`
      return
    }
    const where = event.filename
      ? ` @ ${event.filename.split('/').pop()}:${event.lineno}`
      : ''
    debug.uncaught = `${event.message}${where}`
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
      throw new DOMException('Hit test indisponível', 'NotSupportedError')
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
      const gl = renderer.getContext()
      const layer: object | null = renderer.xr.getBaseLayer()
      const size = (width: number, height: number) => `${width}×${height}`
      const { depthNear, depthFar } = session.renderState ?? {}
      Object.assign(debug, {
        found: surfaceFound,
        reticleVisible: reticle.visible,
        modelVisible: model.visible,
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        layer: !layer ? null : 'textureWidth' in layer ? 'projection' : 'webgl',
        framebuffer: !layer
          ? null
          : 'textureWidth' in layer
            ? size(
                (layer as XRProjectionLayer).textureWidth,
                (layer as XRProjectionLayer).textureHeight,
              )
            : size(
                (layer as XRWebGLLayer).framebufferWidth,
                (layer as XRWebGLLayer).framebufferHeight,
              ),
        features: session.enabledFeatures?.join(', ') ?? null,
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

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Three.js renders into a WebXR Layers projection layer whenever the
 * browser offers `XRWebGLBinding.createProjectionLayer`. Hiding that method
 * while the session starts makes it use a classic XRWebGLLayer. Returns the
 * function that puts the method back.
 */
function hideProjectionLayers(): () => void {
  const binding = (globalThis as { XRWebGLBinding?: { prototype: object } })
    .XRWebGLBinding
  const proto = binding?.prototype
  const descriptor =
    proto && Object.getOwnPropertyDescriptor(proto, 'createProjectionLayer')
  if (!proto || !descriptor?.configurable) return () => {}
  delete (proto as { createProjectionLayer?: unknown }).createProjectionLayer
  return () => Object.defineProperty(proto, 'createProjectionLayer', descriptor)
}
