import { useRef, useState } from 'react'
import type { VariantId } from '../features/material/variants'
import type { MaterialSettings } from '../shared/types'

/**
 * One change to a piece, with the value before and after it (`undefined`:
 * the original, nothing overridden).
 */
export type Edit =
  | {
      kind: 'material'
      modelId: string
      variant: VariantId
      before?: MaterialSettings
      after?: MaterialSettings
    }
  | { kind: 'height'; modelId: string; before?: number; after?: number }

/** Changes this close together on the same thing are one step (a drag). */
export const MERGE_WINDOW_MS = 1000

function sameTarget(a: Edit, b: Edit): boolean {
  if (a.kind === 'material' && b.kind === 'material') {
    return a.modelId === b.modelId && a.variant === b.variant
  }
  return a.kind === b.kind && a.modelId === b.modelId
}

/**
 * Undo and redo for edits. `apply` puts an edit's `before` (undo) or
 * `after` (redo) value back in place.
 */
export function useEditHistory(
  apply: (edit: Edit, direction: 'undo' | 'redo') => void,
) {
  const [past, setPast] = useState<Edit[]>([])
  const [future, setFuture] = useState<Edit[]>([])
  const lastRecord = useRef(0)

  function record(edit: Edit) {
    const now = Date.now()
    const top = past.at(-1)
    const merge =
      top !== undefined &&
      sameTarget(top, edit) &&
      now - lastRecord.current < MERGE_WINDOW_MS
    lastRecord.current = now
    setPast(
      merge
        ? [...past.slice(0, -1), { ...top, after: edit.after } as Edit]
        : [...past, edit],
    )
    setFuture([])
  }

  function undo() {
    const edit = past.at(-1)
    if (!edit) return
    apply(edit, 'undo')
    setPast(past.slice(0, -1))
    setFuture([...future, edit])
    lastRecord.current = 0
  }

  function redo() {
    const edit = future.at(-1)
    if (!edit) return
    apply(edit, 'redo')
    setFuture(future.slice(0, -1))
    setPast([...past, edit])
    lastRecord.current = 0
  }

  return {
    record,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  }
}
