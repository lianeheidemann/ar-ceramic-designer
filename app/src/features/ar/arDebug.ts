import type { WebGLRenderer } from 'three'

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
  /** How far the piece was turned in this session, in degrees. */
  turnDeg: number
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
export const DEBUG_INTERVAL_MS = 250

export function emptyDebugInfo(): ArDebugInfo {
  return {
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
    turnDeg: 0,
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
}

/** The rendering side of the debug panel: layer, draw calls, GL state. */
export function renderInfo(
  renderer: WebGLRenderer,
  session: XRSession,
): Partial<ArDebugInfo> {
  const gl = renderer.getContext()
  const layer: object | null = renderer.xr.getBaseLayer()
  const size = (width: number, height: number) => `${width}×${height}`
  const { depthNear, depthFar } = session.renderState ?? {}
  return {
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
      depthNear === undefined ? null : `${round(depthNear)}–${round(depthFar)}`,
    glError: gl.getError(),
    contextLost: gl.isContextLost(),
  }
}

/** One line for an uncaught error or rejection, with its file and line. */
export function describeUncaught(
  event: ErrorEvent | PromiseRejectionEvent,
): string {
  if ('reason' in event) return `(promise) ${describeError(event.reason)}`
  const where = event.filename
    ? ` @ ${event.filename.split('/').pop()}:${event.lineno}`
    : ''
  return `${event.message}${where}`
}

/** Rounds to centimeters, enough for the debug panel. */
export function round(meters: number): number {
  return Math.round(meters * 100) / 100
}

export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** The AR debug panel's lines. */
export function debugLines(info: ArDebugInfo, testCube: boolean): string[] {
  const yesNo = (value: boolean) => (value ? 'yes' : 'no')
  const meters = (value: number | null) => (value === null ? '—' : `${value} m`)
  return [
    `frames: session ${info.sessionFrames} · app ${info.loopFrames} · drawn ${info.frames}`,
    `layer: ${info.layer ?? '—'}`,
    `uncaught error: ${info.uncaught ?? '—'}`,
    `tracking: ${yesNo(info.tracking)} · hit: ${yesNo(info.hit)} · surface: ${yesNo(info.found)}`,
    `ring: ${meters(info.ringDistance)} from the phone, ${meters(info.ringDrop)} below`,
    `first ring: ${info.firstRingMs === null ? '—' : `${info.firstRingMs} ms`}`,
    `visible: ring ${yesNo(info.reticleVisible)} · piece ${yesNo(info.modelVisible)} · cube ${yesNo(testCube)}`,
    `turn: ${info.turnDeg}°`,
    `draw calls: ${info.calls} · triangles: ${info.triangles}`,
    `framebuffer: ${info.framebuffer ?? '—'} · mode: ${info.blendMode ?? '—'}`,
    `depth: ${info.depthRange ?? '—'}`,
    `WebGL error: ${info.glError} · context lost: ${yesNo(info.contextLost)}`,
    `features: ${info.features ?? '—'}`,
    `error: ${info.error ?? '—'}`,
  ]
}
