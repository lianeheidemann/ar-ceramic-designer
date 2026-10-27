import type { CeramicViewer } from './CeramicViewer'

/**
 * Keeps the cameras of several viewers in the same position, so moving
 * one moves the others.
 */
export class CameraSync {
  private readonly viewers = new Map<CeramicViewer, () => void>()
  /** Set while copying a camera, so the copies don't echo back. */
  private syncing = false

  add(viewer: CeramicViewer): () => void {
    const unsubscribe = viewer.onCameraChange(() => this.broadcast(viewer))
    this.viewers.set(viewer, unsubscribe)
    return () => {
      unsubscribe()
      this.viewers.delete(viewer)
    }
  }

  private broadcast(source: CeramicViewer): void {
    if (this.syncing) return
    this.syncing = true
    const state = source.getCameraState()
    for (const viewer of this.viewers.keys()) {
      if (viewer !== source) viewer.setCameraState(state)
    }
    this.syncing = false
  }
}
