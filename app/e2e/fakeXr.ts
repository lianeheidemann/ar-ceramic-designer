/**
 * A fake WebXR AR device for end-to-end tests, installed in the page with
 * `page.addInitScript(installFakeXr)`. It offers immersive AR with hit tests
 * and a DOM overlay, renders frames with the page's requestAnimationFrame,
 * and lets the test set what ARCore "sees" through `window.fakeXr`.
 *
 * Runs in the browser: it must not use imports or outer variables.
 */
export function installFakeXr(): void {
  type Point = [number, number, number]

  const control = {
    /** Whether ARCore tracks the phone (otherwise no viewer pose). */
    tracking: false,
    /** Nearest plane / feature point under the screen center, if any. */
    plane: null as Point | null,
    point: null as Point | null,
    /** Phone position; it looks straight ahead (-Z). */
    viewer: [0, 1.4, 0] as Point,
    /** Error name for the next session request, e.g. "NotAllowedError". */
    failNext: null as string | null,
    /** Sessions started so far. */
    sessions: 0,
    session: null as EventTarget | null,
    /** Fires an XR "select", as Chrome does for every screen tap. */
    select() {
      control.session?.dispatchEvent(new Event('select'))
    },
  }
  Object.assign(window, { fakeXr: control })

  const translation = ([x, y, z]: Point) =>
    new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1])
  const transform = (position: Point) => ({
    position: { x: position[0], y: position[1], z: position[2], w: 1 },
    orientation: { x: 0, y: 0, z: 0, w: 1 },
    matrix: translation(position),
    inverse: {
      matrix: translation([-position[0], -position[1], -position[2]]),
    },
  })
  // 60° vertical field of view, portrait phone, near 0.01 m, far 100 m.
  const f = 1 / Math.tan(Math.PI / 6)
  const [aspect, near, far] = [0.45, 0.01, 100]
  const projectionMatrix = new Float32Array([
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (far + near) / (near - far),
    -1,
    0,
    0,
    (2 * far * near) / (near - far),
    0,
  ])

  function createSession(): EventTarget {
    const session = new EventTarget()
    let ended = false
    const frame = {
      session,
      getViewerPose: () => {
        if (!control.tracking) return null
        const pose = transform(control.viewer)
        return {
          ...pose,
          transform: pose,
          emulatedPosition: false,
          views: [{ eye: 'none', projectionMatrix, transform: pose }],
        }
      },
      getHitTestResults: (source: { kind: 'plane' | 'point' }) => {
        const hit = control.tracking ? control[source.kind] : null
        return hit ? [{ getPose: () => ({ transform: transform(hit) }) }] : []
      },
    }
    return Object.assign(session, {
      renderState: { baseLayer: null as unknown },
      domOverlayState: { type: 'screen' },
      inputSources: [],
      enabledFeatures: ['hit-test', 'dom-overlay'],
      environmentBlendMode: 'alpha-blend',
      updateRenderState(state: { baseLayer?: unknown }) {
        Object.assign(this.renderState, state)
      },
      requestReferenceSpace: async () => ({}),
      requestHitTestSource: async ({
        entityTypes = ['plane'],
      }: {
        entityTypes?: string[]
      }) => ({ kind: entityTypes[0], cancel() {} }),
      requestAnimationFrame: (callback: FrameRequestCallback) =>
        window.requestAnimationFrame((time) => {
          if (!ended) (callback as (t: number, f: unknown) => void)(time, frame)
        }),
      cancelAnimationFrame: (id: number) => window.cancelAnimationFrame(id),
      async end() {
        if (ended) return
        ended = true
        control.session = null
        session.dispatchEvent(new Event('end'))
      },
    })
  }

  Object.defineProperty(navigator, 'xr', {
    configurable: true,
    value: {
      isSessionSupported: async (mode: string) => mode === 'immersive-ar',
      async requestSession() {
        if (control.failNext) {
          const name = control.failNext
          control.failNext = null
          throw new DOMException('fake', name)
        }
        control.sessions++
        control.session = createSession()
        return control.session
      },
    },
  })

  // Three.js renders into the session's layer; this one is the page canvas.
  class FakeXRWebGLLayer {
    framebuffer = null
    framebufferWidth = 360
    framebufferHeight = 800
    ignoreDepthValues = true
    getViewport() {
      return { x: 0, y: 0, width: 360, height: 800 }
    }
  }
  Object.assign(window, { XRWebGLLayer: FakeXRWebGLLayer })
  // Without XRWebGLBinding, Three.js uses the XRWebGLLayer above.
  delete (window as { XRWebGLBinding?: unknown }).XRWebGLBinding
  WebGL2RenderingContext.prototype.makeXRCompatible = async () => {}
}

/** What the test can control, as seen from the page. */
export type FakeXrControl = {
  tracking: boolean
  plane: [number, number, number] | null
  point: [number, number, number] | null
  viewer: [number, number, number]
  failNext: string | null
  sessions: number
  select: () => void
}
