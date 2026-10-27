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
  /** Called once the session has ended and its resources are released. */
  onEnd: () => void
}

/**
 * Starts an immersive AR session: a ring follows the detected surface
 * under the screen center (hit test) and a tap places the model there.
 * Resolves with a function that ends the session.
 */
export async function startArSession({
  renderer,
  scene,
  camera,
  model,
  overlay,
  onPlaced,
  onEnd,
}: ArSessionOptions): Promise<() => void> {
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
  const controller = renderer.xr.getController(0)
  let hitTestSource: XRHitTestSource | undefined

  // Pieces are rotationally symmetric, so only the position matters.
  const place = () => {
    if (!reticle.visible) return
    model.position.setFromMatrixPosition(reticle.matrix)
    model.visible = true
    onPlaced()
  }

  const cleanUp = () => {
    hitTestSource?.cancel()
    controller.removeEventListener('select', place)
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
  controller.addEventListener('select', place)

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

  return () => {
    session.end().catch(() => {})
  }
}
