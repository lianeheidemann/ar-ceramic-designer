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

  let loop: FrameCallback | null = null
  const renderer = {
    xr: {
      enabled: false,
      setReferenceSpaceType: vi.fn(),
      setSession: vi.fn(async () => {}),
      getReferenceSpace: () => ({}),
    },
    setAnimationLoop: (callback: FrameCallback | null) => {
      loop = callback
    },
    render: vi.fn(),
  } as unknown as WebGLRenderer

  const scene = new Scene()
  const model = new Mesh()
  scene.add(model)
  const events = { onPlaced: vi.fn(), onNoSurface: vi.fn(), onEnd: vi.fn() }

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
      ...events,
    })

  return { session, scene, model, events, frame, start }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('startArSession', () => {
  it('hides the model until a tap places it on the detected surface', async () => {
    const { session, model, events, frame, start } = setup()
    await start()
    expect(model.visible).toBe(false)

    frame(new Vector3(0.3, -1.2, -0.8))
    session.dispatchEvent(new Event('select'))

    expect(model.visible).toBe(true)
    expect(model.position.toArray()).toEqual([0.3, -1.2, -0.8])
    expect(events.onPlaced).toHaveBeenCalledOnce()
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
    const { session, model, events, frame, start } = setup()
    await start()
    frame()
    session.dispatchEvent(new Event('select'))
    expect(model.visible).toBe(false)
    expect(events.onNoSurface).toHaveBeenCalledOnce()
  })

  it('restores the model and cleans up when the session ends', async () => {
    const { session, scene, model, events, frame, start } = setup()
    const handle = await start()
    frame(new Vector3(2, 0, 0))
    session.dispatchEvent(new Event('select'))
    const objects = scene.children.length

    handle.end()
    await vi.waitFor(() => expect(events.onEnd).toHaveBeenCalledOnce())

    expect(model.position.toArray()).toEqual([0, 0, 0])
    expect(model.visible).toBe(true)
    expect(scene.children.length).toBe(objects - 1) // ring removed
    session.dispatchEvent(new Event('select'))
    expect(events.onPlaced).toHaveBeenCalledOnce() // listener removed
  })
})
