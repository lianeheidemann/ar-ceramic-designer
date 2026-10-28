import type { ArStatusIconName } from '../components/ArStatusIcon'

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
      return { icon: 'loading', text: 'Preparando a peça…' }
    case 'placed':
      return {
        icon: 'placed',
        text: 'Peça posicionada. Toque na tela para mover.',
      }
  }
  if (noSurfaceTap) {
    return {
      icon: 'warning',
      text: 'Nenhuma superfície detectada — mova o celular devagar.',
    }
  }
  if (!surfaceFound) {
    return {
      icon: 'scanning',
      text: 'Procurando uma superfície… mova o celular devagar.',
    }
  }
  return state === 'moving'
    ? { icon: 'move', text: 'Toque para colocar a peça aqui.' }
    : {
        icon: 'tap',
        text: 'Superfície encontrada. Toque para posicionar a peça.',
      }
}
