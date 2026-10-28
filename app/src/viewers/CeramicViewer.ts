import {
  Box3,
  DirectionalLight,
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
  Texture,
  Vector3,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { startArSession, type ArSessionHandle } from '../ar/arSession'
import { createModelGeometry } from '../geometry/lathe'
import type { CeramicModel, MaterialSettings } from '../types/ceramic'
import { fitDistance } from './framing'

const FOV_DEG = 35
/** Camera elevation above the horizon when framing, in radians. */
const VIEW_ELEVATION = (25 * Math.PI) / 180
const MAX_PIXEL_RATIO = 2
/** Glaze layer stays smooth whatever the body roughness. */
const CLEARCOAT_ROUGHNESS = 0.05

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
  private readonly gltfLoader = new GLTFLoader()
  private readonly container: HTMLElement
  private model: Object3D | null = null
  /** Applied to every loaded model; `null` uses the model's default. */
  private material: MaterialSettings | null = null
  /** Increments on every load so stale results can be discarded. */
  private loadId = 0
  /** The running AR session, if any. */
  private arSession: ArSessionHandle | null = null

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
    this.controls.enableDamping = true
    // Stop just above the horizon so the camera never goes under the floor.
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    this.resize()

    this.startRenderLoop()
  }

  /** Shows `model`, replacing the current one. Rejects if loading fails. */
  async setModel(model: CeramicModel): Promise<void> {
    const id = ++this.loadId
    const object = await this.loadObject(model)
    if (id !== this.loadId) {
      disposeObject(object)
      return
    }
    this.clearModel()
    applyMaterial(object, this.material ?? model.defaultMaterial)
    this.model = object
    this.scene.add(object)
    this.resetView()
  }

  /** Updates the current model's material and keeps it for later loads. */
  setMaterial(settings: MaterialSettings): void {
    this.material = settings
    if (this.model) applyMaterial(this.model, settings)
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
    },
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
  }

  dispose(): void {
    this.endAr()
    this.loadId++
    this.renderer.setAnimationLoop(null)
    this.resizeObserver.disconnect()
    this.controls.dispose()
    this.clearModel()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  private async loadObject(model: CeramicModel): Promise<Object3D> {
    if (model.source.kind === 'glb') {
      const gltf = await this.gltfLoader.loadAsync(model.source.url)
      cloneMaterials(gltf.scene)
      return gltf.scene
    }
    return new Mesh(
      createModelGeometry(model),
      new MeshPhysicalMaterial({ clearcoatRoughness: CLEARCOAT_ROUGHNESS }),
    )
  }

  private startRenderLoop(): void {
    this.renderer.setAnimationLoop(() => {
      this.controls.update()
      this.renderer.render(this.scene, this.camera)
    })
  }

  /** Flushes leftover damping motion so it cannot move the camera later. */
  private stopMotion(): void {
    this.controls.enableDamping = false
    this.controls.update()
    this.controls.enableDamping = true
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

function applyMaterial(root: Object3D, settings: MaterialSettings): void {
  root.traverse((node) => {
    if (!(node instanceof Mesh)) return
    for (const material of meshMaterials(node)) {
      if (!(material instanceof MeshStandardMaterial)) continue
      material.color.set(settings.color)
      material.roughness = settings.roughness
      material.metalness = settings.metalness
      if (material instanceof MeshPhysicalMaterial) {
        material.clearcoat = settings.clearcoat
      }
    }
  })
}

/** Frees the GPU resources (geometries, materials, textures) of `root`. */
function disposeObject(root: Object3D): void {
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
