import { Matrix4, Mesh, Scene, Vector3, type WebGLRenderer } from 'three'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { startArSession } from './arSession'

type FrameCallback = (time: number, frame?: unknown) => void

/** Minimal stand-ins for the WebXR session and the Three.js renderer. */
function setup() {
  const session = Object.assign(new EventTarget(), {
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
  // Each tap happens 1 s after the previous one unless a test says otherwise.
  let clock = 0
  const tap = () => {
    clock += 1000
    session.dispatchEvent(new Event('select'))
  }
  let compiledWhileVisible: boolean | undefined
  const renderer = {
    xr: {
      enabled: false,
      setReferenceSpaceType: vi.fn(),
      setSession: vi.fn(async () => {}),
      getReferenceSpace: () => ({}),
    },
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
    onEnd: vi.fn(),
  }

  /** Renders one XR frame with a surface at `point`, or none. */
  const frame = (point?: Vector3) =>
    loop?.(0, {
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
      now: () => clock,
      ...events,
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

  it('treats an XR select and an overlay click of one tap as one tap', async () => {
    const { model, events, frame, start, tap } = setup()
    const handle = await start()
    frame(new Vector3(1, 0, 0))
    tap()
    handle.place() // same tap, arriving again through the DOM overlay
    expect(events.onPlaced).toHaveBeenCalledOnce()
    expect(events.onMoveStart).not.toHaveBeenCalled()
    expect(model.visible).toBe(true)
  })

  it('also places the model from a DOM overlay tap', async () => {
    const { model, frame, start } = setup()
    const handle = await start()
    frame(new Vector3(1, 0, 0))
    handle.place()
    expect(model.visible).toBe(true)
    expect(model.position.x).toBe(1)
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
})
