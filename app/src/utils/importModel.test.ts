import { Box3, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import {
  dimensionsFromBox,
  formatLength,
  formatTriangles,
  isGlb,
  modelNameFromFile,
} from './importModel'

const bytes = (text: string) => new TextEncoder().encode(text).buffer

describe('isGlb', () => {
  it('recognizes the binary glTF header', () => {
    expect(isGlb(bytes('glTF\x02\x00\x00\x00'))).toBe(true)
  })

  it('rejects other files', () => {
    expect(isGlb(bytes('{"schema": "x"}'))).toBe(false)
    expect(isGlb(bytes('gl'))).toBe(false)
  })
})

describe('dimensionsFromBox', () => {
  it('converts meters to whole millimeters', () => {
    const box = new Box3(
      new Vector3(-0.0743, 0, -0.0794),
      new Vector3(0.0743, 0.0697, 0.0743),
    )
    expect(dimensionsFromBox(box)).toEqual({
      width: 149,
      height: 70,
      depth: 154,
    })
  })
})

describe('modelNameFromFile', () => {
  it('drops the extension and folders', () => {
    expect(modelNameFromFile('xicara-porcelana.glb')).toBe('xicara-porcelana')
    expect(modelNameFromFile('C:\\modelos\\Vaso Azul.GLB')).toBe('Vaso Azul')
  })

  it('has a fallback for empty names', () => {
    expect(modelNameFromFile('.glb')).toBe('Modelo importado')
  })
})

describe('message formats', () => {
  it('writes lengths in the unit that reads best', () => {
    expect(formatLength(0.98)).toBe('98 cm')
    expect(formatLength(1.25)).toBe('1,3 m')
    expect(formatLength(0.004)).toBe('4 mm')
  })

  it('writes triangle counts in words', () => {
    expect(formatTriangles(1_945_534)).toBe('1,9 milhão de triângulos')
    expect(formatTriangles(2_400_000)).toBe('2,4 milhões de triângulos')
    expect(formatTriangles(940_202)).toBe('940 mil triângulos')
    expect(formatTriangles(12)).toBe('12 triângulos')
  })
})
