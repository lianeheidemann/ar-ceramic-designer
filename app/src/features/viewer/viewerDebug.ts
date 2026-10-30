import type { ViewerStats } from './CeramicViewer'

/** The 3D viewer's debug lines (`?debug=1`, outside AR). */
export function statsLines(stats: ViewerStats): string[] {
  return [
    `fps: ${stats.fps} · drawn: ${stats.framesRendered}`,
    `draw calls: ${stats.drawCalls} · triangles: ${stats.triangles}`,
    `GPU memory: geometries ${stats.geometries} · textures ${stats.textures}`,
    `pixel ratio: ${stats.pixelRatio} · model: ${stats.loadMs ?? '—'} ms`,
    `camera: ${stats.azimuthDeg}° · damping: ${stats.damping ? 'yes' : 'no'}`,
  ]
}
