/**
 * Source dimensions are recorded in millimeters; Three.js and WebXR use
 * meters. Convert at the boundary with these helpers.
 */
export const MM_PER_M = 1000

export function mmToM(mm: number): number {
  return mm / MM_PER_M
}

export function mToMm(m: number): number {
  return m * MM_PER_M
}
