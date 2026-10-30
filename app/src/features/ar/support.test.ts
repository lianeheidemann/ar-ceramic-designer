import { describe, expect, it } from 'vitest'
import { arErrorMessage, checkArSupport } from './support'

const xr = (result: boolean | Error) => ({
  isSessionSupported: () =>
    result instanceof Error ? Promise.reject(result) : Promise.resolve(result),
})

describe('checkArSupport', () => {
  it('requires a secure context', async () => {
    const support = await checkArSupport({
      isSecureContext: false,
      xr: xr(true),
    })
    expect(support.kind).toBe('unavailable')
  })

  it('reports browsers without WebXR', async () => {
    const support = await checkArSupport({ isSecureContext: true })
    expect(support).toMatchObject({ kind: 'unavailable' })
  })

  it('detects immersive AR support', async () => {
    expect(
      await checkArSupport({ isSecureContext: true, xr: xr(true) }),
    ).toEqual({ kind: 'supported' })
  })

  it.each([false, new Error('boom')])(
    'treats %s as unsupported',
    async (result) => {
      const support = await checkArSupport({
        isSecureContext: true,
        xr: xr(result),
      })
      expect(support.kind).toBe('unavailable')
    },
  )
})

describe('arErrorMessage', () => {
  const named = (name: string) =>
    Object.assign(new Error('x'), { name }) as Error

  it('explains permission denial', () => {
    expect(arErrorMessage(named('NotAllowedError'))).toMatch(
      /Permission denied/,
    )
  })

  it('explains missing features', () => {
    expect(arErrorMessage(named('NotSupportedError'))).toMatch(
      /surface detection/,
    )
  })

  it('falls back to a generic message', () => {
    expect(arErrorMessage('???')).toMatch(/Could not start/)
  })
})
