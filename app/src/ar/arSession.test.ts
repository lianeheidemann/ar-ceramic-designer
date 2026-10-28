import { Matrix4, Mesh, Scene, Vector3, type WebGLRenderer } from 'three'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SURFACE_LOST_AFTER_MS, startArSession } from './arSession'

type FrameCallback = (time: number, frame?: unknown) => void

/** Minimal stand-ins for the WebXR session and the Three.js renderer. */
function setup({ domOverlay = false, testCube = false, debug = false } = {}) {
  const session = Object.assign(new EventTarget(), {
    domOverlayState: domOverlay ? { type: 'screen' } : undefined,
    environmentBlendMode: 'alpha-blend',
    renderState: { depthNear: 0.01, depthFar: 100 },
    requestReferenceSpace: vi.fn(async () => ({})),
    requestHitTestSource: vi.fn(async () => ({ cancel: vi.fn() })),
    end: vi.fn(async () => {
      session.dispatchEvent(new Event('end'))
    }),
  })
  vi.stubGlobal('navigator', {
    xr: { requestSession: vi.fn(async () => session) },
  })

  const scene = new Scene()
  const model = new Mesh()
  scene.add(model)

  let loop: FrameCallback | null = null
  const tap = () => session.dispatchEvent(new Event('select'))
  let compiledWhileVisible: boolean | undefined
  const renderer = {
    xr: {
      enabled: false,
      setReferenceSpaceType: vi.fn(),
      setSession: vi.fn(async () => {}),
      getReferenceSpace: () => ({}),
      getBaseLayer: () => ({ framebufferWidth: 1080, framebufferHeight: 2316 }),
    },
    getContext: () => ({ getError: () => 0, isContextLost: () => false }),
    info: { render: { calls: 2, triangles: 300 } },
    compileAsync: vi.fn(async () => {
      compiledWhileVisible = model.visible
    }),
    setAnimationLoop: (callback: FrameCallback | null) => {
      loop = callback
    },
    render: vi.fn(),
  } as unknown as WebGLRenderer
  const events = {
    onPreparing: vi.fn(),
    onPlaced: vi.fn(),
    onMoveStart: vi.fn(),
    onNoSurface: vi.fn(),
    onSurfaceChange: vi.fn(),
    onEnd: vi.fn(),
    onDebug: vi.fn(),
  }

  /** Renders one XR frame with a surface at `point`, or none. */
  // XR frames ~16 ms apart, like a real device at 60 fps.
  let time = 0
  const frame = (point?: Vector3) =>
    loop?.((time += 16), {
      // The phone 1.4 m above the local origin.
      getViewerPose: () => ({
        emulatedPosition: false,
        transform: { position: { x: 0, y: 1.4, z: 0 } },
      }),
      getHitTestResults: () =>
        point
          ? [
              {
                getPose: () => ({
                  transform: {
                    matrix: new Matrix4().setPosition(point).toArray(),
                  },
                }),
              },
            ]
          : [],
    })

  const start = () =>
    startArSession({
      renderer,
      scene,
      camera: new Mesh() as never,
      model,
      overlay: {} as HTMLElement,
      ...events,
      testCube,
      onDebug: debug ? events.onDebug : undefined,
    })

  const ring = () => scene.children.find((child) => child !== model)

  return {
    session,
    scene,
    model,
    events,
    frame,
    start,
    renderer,
    ring,
    tap,
    compiledWhileVisible: () => compiledWhileVisible,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('startArSession', () => {
  it('hides the model until a tap places it on the detected surface', async () => {
    const { tap, model, events, frame, start } = setup()
    await start()
    expect(model.visible).toBe(false)

    frame(new Vector3(0.3, -1.2, -0.8))
    tap()

    expect(model.visible).toBe(true)
    expect(model.position.toArray()).toEqual([0.3, -1.2, -0.8])
    expect(events.onPlaced).toHaveBeenCalledOnce()
  })

  describe('with a DOM overlay (Chrome on Android)', () => {
    it('places the model from an overlay tap', async () => {
      const { model, frame, start } = setup({ domOverlay: true })
      const handle = await start()
      frame(new Vector3(1, 0, 0))
      handle.tapOverlay()
      expect(model.visible).toBe(true)
      expect(model.position.x).toBe(1)
    })

    it('counts a tap once even when its XR select also arrives', async () => {
      const { model, events, frame, start, tap } = setup({ domOverlay: true })
      const handle = await start()
      frame(new Vector3(1, 0, 0))
      handle.tapOverlay()
      tap() // the same tap, delivered again as an XR select, any time later
      expect(events.onPlaced).toHaveBeenCalledOnce()
      expect(events.onMoveStart).not.toHaveBeenCalled()

      // Moving: one tap shows the ring, the next one moves the piece.
      handle.tapOverlay()
      tap()
      expect(events.onMoveStart).toHaveBeenCalledOnce()
      frame(new Vector3(2, 0, 0))
      handle.tapOverlay()
      tap()
      expect(model.position.x).toBe(2)
      expect(events.onPlaced).toHaveBeenCalledTimes(2)
    })
  })

  it('ignores overlay taps when the session has no DOM overlay', async () => {
    const { model, frame, start } = setup()
    const handle = await start()
    frame(new Vector3(1, 0, 0))
    handle.tapOverlay()
    expect(model.visible).toBe(false)
  })

  it('reports taps while no surface is detected', async () => {
    const { tap, model, events, frame, start } = setup()
    await start()
    frame()
    tap()
    expect(model.visible).toBe(false)
    expect(events.onNoSurface).toHaveBeenCalledOnce()
  })

  it('compiles the piece while visible before the first tap', async () => {
    const { renderer, events, model, start, compiledWhileVisible } = setup()
    await start()
    expect(events.onPreparing).toHaveBeenCalledOnce()
    expect(renderer.compileAsync).toHaveBeenCalledOnce()
    expect(compiledWhileVisible()).toBe(true)
    expect(model.visible).toBe(false)
  })

  it('hides the ring once the piece is placed', async () => {
    const { tap, ring, frame, start } = setup()
    await start()
    frame(new Vector3(0, 0, -1))
    expect(ring()?.visible).toBe(true)
    tap()
    frame(new Vector3(0, 0, -1))
    expect(ring()?.visible).toBe(false)
  })

  it('moves the piece in two taps: show the ring, then place', async () => {
    const { tap, model, events, ring, frame, start } = setup()
    await start()
    frame(new Vector3(1, 0, 0))
    tap()

    frame(new Vector3(2, 0, 0))
    tap()
    expect(events.onMoveStart).toHaveBeenCalledOnce()
    expect(model.position.x).toBe(1) // not moved yet
    frame(new Vector3(2, 0, 0))
    expect(ring()?.visible).toBe(true)

    tap()
    expect(model.position.x).toBe(2)
    expect(events.onPlaced).toHaveBeenCalledTimes(2)
  })

  it('reports when a surface is found and lost, once per change', async () => {
    const { events, frame, start } = setup()
    await start()
    frame()
    frame(new Vector3(0, 0, -1))
    frame(new Vector3(0.1, 0, -1))
    expect(events.onSurfaceChange.mock.calls).toEqual([[true]])
    for (let i = 0; i < SURFACE_LOST_AFTER_MS / 16 + 1; i++) frame()
    expect(events.onSurfaceChange.mock.calls).toEqual([[true], [false]])
  })

  it('keeps the ring steady through short hit test dropouts', async () => {
    const { events, ring, frame, start } = setup()
    await start()
    frame(new Vector3(0.5, 0, -1))
    // A few frames without a hit, as happens while the phone moves.
    for (let i = 0; i < 10; i++) {
      frame()
      expect(ring()?.visible).toBe(true)
    }
    frame(new Vector3(0.6, 0, -1))
    expect(events.onSurfaceChange.mock.calls).toEqual([[true]])
  })

  it('restores the model and cleans up when the session ends', async () => {
    const { tap, scene, model, events, frame, start } = setup()
    const handle = await start()
    frame(new Vector3(2, 0, 0))
    tap()
    const objects = scene.children.length

    handle.end()
    await vi.waitFor(() => expect(events.onEnd).toHaveBeenCalledOnce())

    expect(model.position.toArray()).toEqual([0, 0, 0])
    expect(model.visible).toBe(true)
    expect(scene.children.length).toBe(objects - 1) // ring removed
    tap()
    expect(events.onPlaced).toHaveBeenCalledOnce() // listener removed
  })

  describe('diagnostics (?debug=1)', () => {
    it('reports what the session sees and draws', async () => {
      const { events, frame, start } = setup({ debug: true })
      await start()
      frame(new Vector3(0, 0.4, -0.75))
      expect(events.onDebug).toHaveBeenCalledOnce()
      expect(events.onDebug.mock.lastCall?.[0]).toMatchObject({
        tracking: true,
        hit: true,
        found: true,
        ringDistance: 1.25,
        ringDrop: 1,
        firstRingMs: 0,
        reticleVisible: true,
        modelVisible: false,
        frames: 1,
        calls: 2,
        framebuffer: '1080×2316',
        blendMode: 'alpha-blend',
        depthRange: '0.01–100',
        error: null,
      })
    })

    it('reports a few times per second, not every frame', async () => {
      const { events, frame, start } = setup({ debug: true })
      await start()
      for (let i = 0; i < 32; i++) frame()
      expect(events.onDebug.mock.calls.length).toBe(2)
    })

    it('keeps the loop running when a frame fails to render', async () => {
      const { events, frame, renderer, start } = setup({ debug: true })
      await start()
      vi.mocked(renderer.render).mockImplementationOnce(() => {
        throw new Error('render failed')
      })
      frame(new Vector3(0, 0, -1))
      for (let i = 0; i < 16; i++) frame(new Vector3(0, 0, -1))
      const info = events.onDebug.mock.lastCall?.[0]
      expect(info.error).toBe('render failed')
      expect(info.frames).toBe(16)
    })
  })

  it('shows a test cube in front of the phone until the session ends', async () => {
    const { events, scene, model, start } = setup({ testCube: true })
    const handle = await start()
    const cube = scene.children.find(
      (child) => child !== model && child.position.z === -0.5,
    )
    expect(cube).toBeDefined()
    expect(cube?.frustumCulled).toBe(false)
    handle.end()
    await vi.waitFor(() => expect(events.onEnd).toHaveBeenCalledOnce())
    expect(scene.children).not.toContain(cube)
  })
})
