import {
  Box3,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  Object3D,
  PerspectiveCamera,
  Scene,
  Sphere,
  Spherical,
  Texture,
  Vector3,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import {
  startArSession,
  type ArSessionHandle,
  type ArSessionOptions,
} from '../ar/arSession'
import { createModelGeometry } from '../geometry/lathe'
import type { CeramicModel, MaterialSettings } from '../types/ceramic'
import { fitDistance, stepOrbit } from './framing'
import { createGltfLoader } from './gltfLoader'
import { simplifyHeavyMeshes } from './simplify'

const FOV_DEG = 35
/** Camera elevation above the horizon when framing, in radians. */
const VIEW_ELEVATION = (25 * Math.PI) / 180
const MAX_PIXEL_RATIO = 2
/** Glaze layer stays smooth whatever the body roughness. */
const CLEARCOAT_ROUGHNESS = 0.05
/** One arrow key press turns the camera this much. */
const KEY_ORBIT_STEP = (15 * Math.PI) / 180
/** One +/- key press scales the camera distance by this much. */
const KEY_ZOOM_STEP = 0.85

/** Rendering figures for the debug panel (`?debug=1`). */
export interface ViewerStats {
  /** Frames rendered in the last second; 0 while nothing changes. */
  fps: number
  framesRendered: number
  drawCalls: number
  triangles: number
  /** GPU resources alive; should not grow when switching models. */
  geometries: number
  textures: number
  pixelRatio: number
  /** Time to build or load the current model, in ms. */
  loadMs: number | null
  /** Camera angle around the vertical axis, in degrees. */
  azimuthDeg: number
  damping: boolean
}

export interface CameraState {
  position: Vector3
  target: Vector3
}

/**
 * Three.js scene for inspecting one ceramic model: renderer, lights,
 * camera, orbit controls, model loading and cleanup. Independent of React.
 */
export class CeramicViewer {
  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly camera = new PerspectiveCamera(FOV_DEG, 1, 0.01, 10)
  private readonly controls: OrbitControls
  private readonly resizeObserver: ResizeObserver
  private readonly gltfLoader = createGltfLoader()
  private readonly container: HTMLElement
  private model: Object3D | null = null
  /** Applied to every loaded model; `null` uses the model's default. */
  private material: MaterialSettings | null = null
  /** Uniform scale of the model (real size of imported pieces). */
  private scale = 1
  /** Increments on every load so stale results can be discarded. */
  private loadId = 0
  /** The running AR session, if any. */
  private arSession: ArSessionHandle | null = null
  /** Set when the next frame must be drawn even if the camera is still. */
  private needsRender = true
  /** Camera glide after a drag; off for users who prefer reduced motion. */
  private readonly damping: boolean
  private framesRendered = 0
  /** When each of the last second's frames was rendered. */
  private readonly frameTimes: number[] = []
  private loadMs: number | null = null
  private readonly contextListeners = new Set<(lost: boolean) => void>()

  constructor(container: HTMLElement) {
    this.container = container
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO),
    )
    this.renderer.toneMapping = NeutralToneMapping
    container.appendChild(this.renderer.domElement)

    this.scene.add(new HemisphereLight('#ffffff', '#b8a898', 1.2))
    const keyLight = new DirectionalLight('#ffffff', 2)
    keyLight.position.set(1, 2, 1.5)
    this.scene.add(keyLight)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.damping = !window.matchMedia?.('(prefers-reduced-motion: reduce)')
      .matches
    this.controls.enableDamping = this.damping
    // Stop just above the horizon so the camera never goes under the floor.
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05

    const canvas = this.renderer.domElement
    // Keyboard control: focus the canvas, then arrows, +/- and Home.
    canvas.tabIndex = 0
    canvas.setAttribute(
      'aria-label',
      '3D piece. Arrows turn it, + and − zoom, Home resets the view.',
    )
    canvas.addEventListener('keydown', this.onKeyDown)
    canvas.addEventListener('webglcontextlost', this.onContextLost)
    canvas.addEventListener('webglcontextrestored', this.onContextRestored)

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    this.resize()

    this.startRenderLoop()
  }

  /** Shows `model`, replacing the current one. Rejects if loading fails. */
  async setModel(model: CeramicModel): Promise<void> {
    const id = ++this.loadId
    const started = performance.now()
    const object = await this.loadObject(model)
    if (id !== this.loadId) {
      disposeObject(object)
      return
    }
    this.clearModel()
    applyMaterial(object, this.material ?? model.defaultMaterial)
    object.scale.setScalar(this.scale)
    this.model = object
    this.scene.add(object)
    this.loadMs = Math.round(performance.now() - started)
    this.resetView()
  }

  /**
   * Scales the model uniformly (it grows from its base) and frames it
   * again; kept for later loads. AR places it at this size.
   */
  setScale(scale: number): void {
    if (scale === this.scale) return
    this.scale = scale
    if (!this.model) return
    this.model.scale.setScalar(scale)
    this.resetView()
  }

  /** Updates the current model's material and keeps it for later loads. */
  setMaterial(settings: MaterialSettings): void {
    this.material = settings
    if (this.model) applyMaterial(this.model, settings)
    this.invalidate()
  }

  /** Frames the current model from the default angle. */
  resetView(): void {
    if (!this.model) return
    const sphere = new Box3()
      .setFromObject(this.model)
      .getBoundingSphere(new Sphere())
    const distance = fitDistance(sphere.radius, FOV_DEG, this.camera.aspect)
    const direction = new Vector3(
      0,
      Math.sin(VIEW_ELEVATION),
      Math.cos(VIEW_ELEVATION),
    )

    this.stopMotion()
    this.controls.target.copy(sphere.center)
    this.camera.position
      .copy(sphere.center)
      .addScaledVector(direction, distance)
    this.camera.near = distance / 100
    this.camera.far = distance * 100
    this.camera.updateProjectionMatrix()
    this.controls.minDistance = sphere.radius * 1.2
    this.controls.maxDistance = distance * 4
    this.controls.update()
    this.invalidate()
  }

  /**
   * Keyboard control: arrows turn the camera, + and - zoom, Home (or 0)
   * frames the piece again. Returns whether the key was used.
   */
  handleKey(key: string): boolean {
    const steps: Record<string, Parameters<typeof stepOrbit>[1]> = {
      ArrowLeft: { dAzimuth: -KEY_ORBIT_STEP },
      ArrowRight: { dAzimuth: KEY_ORBIT_STEP },
      ArrowUp: { dPolar: -KEY_ORBIT_STEP },
      ArrowDown: { dPolar: KEY_ORBIT_STEP },
      '+': { zoom: KEY_ZOOM_STEP },
      '=': { zoom: KEY_ZOOM_STEP },
      '-': { zoom: 1 / KEY_ZOOM_STEP },
    }
    if (key === 'Home' || key === '0') {
      this.resetView()
      return true
    }
    const step = steps[key]
    if (!step || !this.model) return false
    const { target } = this.controls
    const offset = this.camera.position.clone().sub(target)
    const spherical = new Spherical().setFromVector3(offset)
    const next = stepOrbit(
      {
        radius: spherical.radius,
        polar: spherical.phi,
        azimuth: spherical.theta,
      },
      step,
      {
        minDistance: this.controls.minDistance,
        maxDistance: this.controls.maxDistance,
        minPolar: this.controls.minPolarAngle,
        maxPolar: this.controls.maxPolarAngle,
      },
    )
    spherical.set(next.radius, next.polar, next.azimuth)
    this.stopMotion()
    this.camera.position.copy(target).add(offset.setFromSpherical(spherical))
    // Also emits "change", so the other viewers in a comparison follow.
    this.controls.update()
    this.invalidate()
    return true
  }

  /** Calls `listener` when the WebGL context is lost (true) or back. */
  onContextChange(listener: (lost: boolean) => void): () => void {
    this.contextListeners.add(listener)
    return () => this.contextListeners.delete(listener)
  }

  getStats(): ViewerStats {
    const now = performance.now()
    while (this.frameTimes.length && this.frameTimes[0] < now - 1000) {
      this.frameTimes.shift()
    }
    const { render, memory } = this.renderer.info
    const offset = this.camera.position.clone().sub(this.controls.target)
    const azimuth = new Spherical().setFromVector3(offset).theta
    return {
      fps: this.frameTimes.length,
      framesRendered: this.framesRendered,
      drawCalls: render.calls,
      triangles: render.triangles,
      geometries: memory.geometries,
      textures: memory.textures,
      pixelRatio: this.renderer.getPixelRatio(),
      loadMs: this.loadMs,
      azimuthDeg: Math.round((azimuth * 180) / Math.PI),
      damping: this.damping,
    }
  }

  /**
   * Opens the camera in AR so the user can place the current model on a
   * real surface. Rejects if the session cannot start.
   */
  async startAr(
    overlay: HTMLElement,
    events: {
      onPreparing: () => void
      onPlaced: () => void
      onMoveStart: () => void
      onNoSurface: () => void
      onSurfaceChange: (found: boolean) => void
      onEnd: () => void
      onDebug?: ArSessionOptions['onDebug']
    },
    options: Pick<ArSessionOptions, 'testCube' | 'projectionLayer'> = {},
  ): Promise<void> {
    if (!this.model || this.arSession) return
    this.controls.enabled = false
    const restore = () => {
      this.arSession = null
      this.controls.enabled = true
      this.startRenderLoop()
      this.resize()
      this.resetView()
    }
    try {
      this.arSession = await startArSession({
        renderer: this.renderer,
        scene: this.scene,
        camera: this.camera,
        model: this.model,
        overlay,
        onPreparing: events.onPreparing,
        onPlaced: events.onPlaced,
        onMoveStart: events.onMoveStart,
        onNoSurface: events.onNoSurface,
        onSurfaceChange: events.onSurfaceChange,
        onDebug: events.onDebug,
        ...options,
        onEnd: () => {
          restore()
          events.onEnd()
        },
      })
    } catch (error) {
      restore()
      throw error
    }
  }

  /** Places the model on the AR surface ring (tap on the DOM overlay). */
  placeAr(): void {
    this.arSession?.tapOverlay()
  }

  endAr(): void {
    this.arSession?.end()
  }

  /**
   * PNG of the current 3D view, or `null` if the browser cannot encode it.
   * Not available in AR: the camera image is not part of the canvas.
   */
  captureImage(): Promise<Blob | null> {
    if (this.renderer.xr.isPresenting) return Promise.resolve(null)
    // Render and read in the same task: the drawing buffer is not kept.
    this.renderer.render(this.scene, this.camera)
    return new Promise((resolve) =>
      this.renderer.domElement.toBlob(resolve, 'image/png'),
    )
  }

  /** Calls `listener` whenever the camera moves. Returns an unsubscribe. */
  onCameraChange(listener: () => void): () => void {
    this.controls.addEventListener('change', listener)
    return () => this.controls.removeEventListener('change', listener)
  }

  getCameraState(): CameraState {
    return {
      position: this.camera.position.clone(),
      target: this.controls.target.clone(),
    }
  }

  setCameraState({ position, target }: CameraState): void {
    // Drop this viewer's own glide so it follows the other camera exactly.
    this.stopMotion()
    this.camera.position.copy(position)
    this.controls.target.copy(target)
    this.controls.update()
    this.invalidate()
  }

  dispose(): void {
    this.endAr()
    this.loadId++
    this.renderer.setAnimationLoop(null)
    this.resizeObserver.disconnect()
    const canvas = this.renderer.domElement
    canvas.removeEventListener('keydown', this.onKeyDown)
    canvas.removeEventListener('webglcontextlost', this.onContextLost)
    canvas.removeEventListener('webglcontextrestored', this.onContextRestored)
    this.contextListeners.clear()
    this.controls.dispose()
    this.clearModel()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  private async loadObject(model: CeramicModel): Promise<Object3D> {
    if (model.source.kind === 'glb') {
      const gltf = await this.gltfLoader.loadAsync(model.source.url)
      cloneMaterials(gltf.scene)
      keepFileMaterials(gltf.scene)
      await simplifyHeavyMeshes(gltf.scene, model.source.url)
      return standOnOrigin(gltf.scene)
    }
    return new Mesh(
      createModelGeometry(model),
      new MeshPhysicalMaterial({ clearcoatRoughness: CLEARCOAT_ROUGHNESS }),
    )
  }

  /**
   * Draws only when something changed (camera moving or gliding, model,
   * material, size): a still piece costs no GPU work or battery.
   */
  private startRenderLoop(): void {
    this.invalidate()
    this.renderer.setAnimationLoop((time) => {
      const moved = this.controls.update()
      if (!moved && !this.needsRender) return
      this.needsRender = false
      this.renderer.render(this.scene, this.camera)
      this.framesRendered++
      this.frameTimes.push(time)
      if (this.frameTimes.length > 120) this.frameTimes.shift()
    })
  }

  private invalidate(): void {
    this.needsRender = true
  }

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    if (this.handleKey(event.key)) event.preventDefault()
  }

  private readonly onContextLost = (event: Event) => {
    // Without this the browser never gives the context back.
    event.preventDefault()
    for (const listener of this.contextListeners) listener(true)
  }

  private readonly onContextRestored = () => {
    // Three.js re-creates its GPU state; draw the scene again.
    this.invalidate()
    for (const listener of this.contextListeners) listener(false)
  }

  /** Flushes leftover damping motion so it cannot move the camera later. */
  private stopMotion(): void {
    this.controls.enableDamping = false
    this.controls.update()
    this.controls.enableDamping = this.damping
  }

  private clearModel(): void {
    if (!this.model) return
    this.scene.remove(this.model)
    disposeObject(this.model)
    this.model = null
  }

  private resize(): void {
    const { clientWidth: width, clientHeight: height } = this.container
    // The XR device controls the size while an AR session is running.
    if (width === 0 || height === 0 || this.renderer.xr.isPresenting) return
    this.renderer.setSize(width, height)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.invalidate()
  }
}

function meshMaterials(mesh: Mesh): Material[] {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material]
}

/**
 * Gives every mesh its own material instances: glTF files may share one
 * material between meshes, and edits must not leak between them.
 */
function cloneMaterials(root: Object3D): void {
  root.traverse((node) => {
    if (!(node instanceof Mesh)) return
    const clones = meshMaterials(node).map((material) => material.clone())
    node.material = Array.isArray(node.material) ? clones : clones[0]
  })
}

/** A GLB material's own values, kept so edits can be undone. */
interface FileMaterial {
  color: Color
  roughness: number
  metalness: number
}

/** Remembers each GLB material's own color, roughness and metalness. */
function keepFileMaterials(root: Object3D): void {
  root.traverse((node) => {
    if (!(node instanceof Mesh)) return
    for (const material of meshMaterials(node)) {
      if (!(material instanceof MeshStandardMaterial)) continue
      const original: FileMaterial = {
        color: material.color.clone(),
        roughness: material.roughness,
        metalness: material.metalness,
      }
      material.userData.original = original
    }
  })
}

/**
 * Wraps a loaded scene so its base sits on the origin, centered: AR places
 * the origin on the surface, whatever origin the file was made with.
 */
function standOnOrigin(scene: Object3D): Object3D {
  const box = new Box3().setFromObject(scene)
  const center = box.getCenter(new Vector3())
  scene.position.sub(new Vector3(center.x, box.min.y, center.z))
  return new Group().add(scene)
}

/**
 * Sets a model's finish. Generated models take the values as they are; on
 * GLB models they scale the file's own values, as glTF factors do, so the
 * defaults (white, 1, 1) leave the file's look untouched.
 */
function applyMaterial(root: Object3D, settings: MaterialSettings): void {
  root.traverse((node) => {
    if (!(node instanceof Mesh)) return
    for (const material of meshMaterials(node)) {
      if (!(material instanceof MeshStandardMaterial)) continue
      const original = material.userData.original as FileMaterial | undefined
      material.color.set(settings.color)
      material.roughness = settings.roughness
      material.metalness = settings.metalness
      if (original) {
        material.color.multiply(original.color)
        material.roughness *= original.roughness
        material.metalness *= original.metalness
      }
      if (material instanceof MeshPhysicalMaterial) {
        material.clearcoat = settings.clearcoat
      }
    }
  })
}

/** Frees the GPU resources (geometries, materials, textures) of `root`. */
export function disposeObject(root: Object3D): void {
  root.traverse((node) => {
    if (!(node instanceof Mesh)) return
    node.geometry.dispose()
    for (const material of meshMaterials(node)) {
      for (const value of Object.values(material)) {
        if (value instanceof Texture) value.dispose()
      }
      material.dispose()
    }
  })
}
