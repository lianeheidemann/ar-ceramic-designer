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
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 8h3l2-3h6l2 3h3v11H4Z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
      </button>
      <button
        type="button"
        className="viewer-button viewer-icon"
        onClick={onResetView}
        aria-label="Reset view"
        title="Reset view"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 3v5h5" />
        </svg>
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
            'View in AR'
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
