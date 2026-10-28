import {
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
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
  /** Called once the session has ended and its resources are released. */
  onEnd: () => void
  /** Clock in milliseconds; replaceable in tests. */
  now?: () => number
}

export interface ArSessionHandle {
  end: () => void
  /** Handles a tap, e.g. from the DOM overlay (same as an XR "select"). */
  place: () => void
}

/**
 * placing: choosing the first spot · placed: piece shown, ring hidden ·
 * moving: piece shown, ring back to choose a new spot.
 */
type PlacementMode = 'placing' | 'placed' | 'moving'

/**
 * One tap can arrive twice (XR "select" and a DOM overlay click); events
 * closer than this are treated as the same tap.
 */
const SAME_TAP_MS = 400

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
  onEnd,
  now = () => performance.now(),
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

  const savedPosition = model.position.clone()
  const savedVisible = model.visible
  let hitTestSource: XRHitTestSource | undefined
  let mode: PlacementMode = 'placing'
  /** Whether a surface was detected under the ring in the last frame. */
  let surfaceFound = false
  let lastTap = -Infinity

  // Pieces are rotationally symmetric, so only the position matters.
  const place = () => {
    const time = now()
    if (time - lastTap < SAME_TAP_MS) return
    lastTap = time
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
    session.removeEventListener('select', place)
    scene.remove(reticle)
    reticle.geometry.dispose()
    reticle.material.dispose()
    model.position.copy(savedPosition)
    model.visible = savedVisible
    onEnd()
  }
  session.addEventListener('end', cleanUp, { once: true })

  try {
    renderer.xr.enabled = true
    renderer.xr.setReferenceSpaceType('local')
    await renderer.xr.setSession(session)
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
  // Listen on the session itself: with a DOM overlay, screen taps are not
  // reliably routed to Three.js controllers.
  session.addEventListener('select', place)

  renderer.setAnimationLoop((_time, frame) => {
    const referenceSpace = renderer.xr.getReferenceSpace()
    const pose =
      frame && hitTestSource && referenceSpace
        ? frame.getHitTestResults(hitTestSource)[0]?.getPose(referenceSpace)
        : undefined
    surfaceFound = Boolean(pose)
    if (pose) reticle.matrix.fromArray(pose.transform.matrix)
    reticle.visible = surfaceFound && mode !== 'placed'
    renderer.render(scene, camera)
  })

  return {
    end: () => {
      session.end().catch(() => {})
    },
    place,
  }
}
