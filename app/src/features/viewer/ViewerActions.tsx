import { ArIcon, CameraIcon, ResetIcon } from '../../shared/icons'
import type { ArState } from '../ar/arStatus'

interface ViewerActionsProps {
  ar: ArState
  /** Shows the "View in AR" button (the browser supports immersive AR). */
  arSupported: boolean
  onSaveImage: () => void
  onResetView: () => void
  onStartAr: () => void
}

/** The buttons over the 3D view: save image, reset view, View in AR. */
export function ViewerActions({
  ar,
  arSupported,
  onSaveImage,
  onResetView,
  onStartAr,
}: ViewerActionsProps) {
  return (
    <div className="viewer-actions">
      <button
        type="button"
        className="viewer-button viewer-icon"
        disabled={ar !== 'off'}
        onClick={onSaveImage}
        aria-label="Save image"
        title="Save image (PNG)"
      >
        <CameraIcon />
      </button>
      <button
        type="button"
        className="viewer-button viewer-icon"
        onClick={onResetView}
        aria-label="Reset view"
        title="Reset view"
      >
        <ResetIcon />
      </button>
      {/* Last: by the right edge, where the thumb rests. */}
      {arSupported && (
        <button
          type="button"
          className="viewer-button viewer-ar"
          disabled={ar !== 'off'}
          onClick={onStartAr}
        >
          {ar === 'off' ? (
            <>
              <ArIcon />
              View in AR
            </>
          ) : (
            <>
              <span className="spinner" aria-hidden="true" />
              Opening AR…
            </>
          )}
        </button>
      )}
    </div>
  )
}
