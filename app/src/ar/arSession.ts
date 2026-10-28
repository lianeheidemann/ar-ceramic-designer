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
  onPlaced: () => void
  /** The user tapped while no surface was detected under the ring. */
  onNoSurface: () => void
  /** Called once the session has ended and its resources are released. */
  onEnd: () => void
}

export interface ArSessionHandle {
  end: () => void
  /** Places the model on the ring, e.g. from a tap on the DOM overlay. */
  place: () => void
}

/**
 * Starts an immersive AR session: a ring follows the detected surface
 * under the screen center (hit test) and a tap places the model there.
 */
export async function startArSession({
  renderer,
  scene,
  camera,
  model,
  overlay,
  onPlaced,
  onNoSurface,
  onEnd,
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

  // Pieces are rotationally symmetric, so only the position matters.
  const place = () => {
    if (!reticle.visible) {
      onNoSurface()
      return
    }
    model.position.setFromMatrixPosition(reticle.matrix)
    model.visible = true
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
    const viewerSpace = await session.requestReferenceSpace('viewer')
    hitTestSource = await session.requestHitTestSource?.({ space: viewerSpace })
    if (!hitTestSource) {
      throw new DOMException('Hit test indisponível', 'NotSupportedError')
    }
  } catch (error) {
    session.removeEventListener('end', cleanUp)
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
    reticle.visible = Boolean(pose)
    if (pose) reticle.matrix.fromArray(pose.transform.matrix)
    renderer.render(scene, camera)
  })

  return {
    end: () => {
      session.end().catch(() => {})
    },
    place,
  }
}
