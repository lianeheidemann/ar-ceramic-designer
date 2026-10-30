import { useEffect, useRef, type MouseEvent, type RefObject } from 'react'
import { MAX_HEIGHT_CM, MIN_HEIGHT_CM, formatCm } from '../../shared/units'
import { debugLines, type ArDebugInfo } from './arDebug'
import type { ArState, ArStatus } from './arStatus'
import { ArStatusIcon } from './ArStatusIcon'
import { AR_DEBUG, AR_TEST_CUBE } from './testSwitches'

interface ArOverlayProps {
  /** The WebXR DOM overlay root. */
  overlayRef: RefObject<HTMLDivElement | null>
  ar: ArState
  status: ArStatus | null
  /** Whether any surface was found in this session (ends the intro hint). */
  surfaceSeen: boolean
  debugInfo: ArDebugInfo | null
  /** Height the piece is shown at; with `onHeightChange`, offers − / +. */
  heightMm?: number
  onHeightChange?: (heightMm: number) => void
  /** A tap on the camera image: places or picks up the piece. */
  onTap: () => void
  onExit: () => void
}

/** Shown over the camera image during an AR session. */
export function ArOverlay({
  overlayRef,
  ar,
  status,
  surfaceSeen,
  debugInfo,
  heightMm,
  onHeightChange,
  onTap,
  onExit,
}: ArOverlayProps) {
  const buttonsRef = useRef<HTMLDivElement>(null)

  // A tap on the AR buttons must not also place the piece behind them.
  useEffect(() => {
    const buttons = buttonsRef.current
    if (!buttons) return
    const keepTap = (event: Event) => event.preventDefault()
    buttons.addEventListener('beforexrselect', keepTap)
    return () => buttons.removeEventListener('beforexrselect', keepTap)
  }, [])

  /** Changes the height by whole centimeters, within the field's limits. */
  function stepHeight(event: MouseEvent, cm: number) {
    event.stopPropagation()
    if (heightMm === undefined) return
    const next = Math.round(heightMm / 10) + cm
    onHeightChange?.(
      Math.min(MAX_HEIGHT_CM, Math.max(MIN_HEIGHT_CM, next)) * 10,
    )
  }

  return (
    <div
      className="ar-overlay"
      ref={overlayRef}
      hidden={ar === 'off' || ar === 'starting'}
      // Second path for taps besides the XR "select" event.
      onClick={onTap}
    >
      <p className="ar-hint" role="status">
        {status && (
          <>
            <ArStatusIcon name={status.icon} />
            {status.text}
          </>
        )}
      </p>
      {status?.icon === 'scanning' && !surfaceSeen && (
        // Large hint while ARCore looks for the first surface (can take
        // seconds); later dropouts only change the small message.
        <div className="ar-scan" aria-hidden="true">
          <ArStatusIcon name="scanning" />
        </div>
      )}
      {AR_DEBUG && debugInfo && (
        <pre className="ar-debug">
          {debugLines(debugInfo, AR_TEST_CUBE).join('\n')}
        </pre>
      )}
      <div className="ar-buttons" ref={buttonsRef}>
        {heightMm !== undefined && onHeightChange && (
          <div className="ar-size" role="group" aria-label="Piece height">
            <button
              type="button"
              aria-label="Smaller"
              disabled={heightMm <= MIN_HEIGHT_CM * 10}
              onClick={(event) => stepHeight(event, -1)}
            >
              −
            </button>
            <span role="status">{formatCm(heightMm)} cm</span>
            <button
              type="button"
              aria-label="Larger"
              disabled={heightMm >= MAX_HEIGHT_CM * 10}
              onClick={(event) => stepHeight(event, 1)}
            >
              +
            </button>
          </div>
        )}
        <button
          type="button"
          className="ar-exit"
          onClick={(event) => {
            event.stopPropagation()
            onExit()
          }}
        >
          Exit AR
        </button>
      </div>
    </div>
  )
}
