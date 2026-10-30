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

/** Limits of a piece's real height, in centimeters. */
export const MIN_HEIGHT_CM = 0.5
export const MAX_HEIGHT_CM = 300

/** "12.5" for 125 mm: a height in centimeters, to a tenth. */
export function formatCm(mm: number): string {
  return String(Math.round(mm) / 10)
}
