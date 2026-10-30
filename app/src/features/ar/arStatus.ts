import type { ArStatusIconName } from './ArStatusIcon'

export type ArState =
  'off' | 'starting' | 'preparing' | 'placing' | 'placed' | 'moving'

export interface ArStatus {
  icon: ArStatusIconName
  text: string
}

/** What the AR overlay shows for the current state, or `null` (hidden). */
export function arStatus(
  state: ArState,
  {
    surfaceFound,
    noSurfaceTap,
  }: { surfaceFound: boolean; noSurfaceTap: boolean },
): ArStatus | null {
  switch (state) {
    case 'off':
    case 'starting':
      return null
    case 'preparing':
      return { icon: 'loading', text: 'Preparing the piece…' }
    case 'placed':
      return {
        icon: 'placed',
        text: 'Piece placed. Tap the screen to move it.',
      }
  }
  if (noSurfaceTap) {
    return {
      icon: 'warning',
      text: 'No surface detected — move the phone slowly.',
    }
  }
  if (!surfaceFound) {
    return {
      icon: 'scanning',
      text: 'Looking for a surface… move the phone slowly.',
    }
  }
  return state === 'moving'
    ? { icon: 'move', text: 'Tap to place the piece here.' }
    : {
        icon: 'tap',
        text: 'Surface found. Tap to place the piece.',
      }
}
