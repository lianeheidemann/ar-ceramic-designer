import { describe, expect, it } from 'vitest'
import { arStatus } from './arStatus'

const idle = { surfaceFound: false, noSurfaceTap: false }

describe('arStatus', () => {
  it('shows nothing outside an AR session', () => {
    expect(arStatus('off', idle)).toBeNull()
    expect(arStatus('starting', idle)).toBeNull()
  })

  it.each([
    ['preparing', idle, 'loading'],
    ['placing', idle, 'scanning'],
    ['placing', { ...idle, surfaceFound: true }, 'tap'],
    ['placing', { surfaceFound: false, noSurfaceTap: true }, 'warning'],
    ['placed', { ...idle, surfaceFound: true }, 'placed'],
    ['moving', idle, 'scanning'],
    ['moving', { ...idle, surfaceFound: true }, 'move'],
  ] as const)('%s %o shows the %s icon', (state, flags, icon) => {
    expect(arStatus(state, flags)?.icon).toBe(icon)
  })

  it('keeps the placed message when a surface comes and goes', () => {
    expect(arStatus('placed', idle)?.icon).toBe('placed')
  })
})
