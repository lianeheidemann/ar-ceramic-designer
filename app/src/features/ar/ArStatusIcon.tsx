export type ArStatusIconName =
  'loading' | 'scanning' | 'tap' | 'placed' | 'move' | 'warning'

const paths: Record<Exclude<ArStatusIconName, 'loading'>, string[]> = {
  // Camera frame corners, like the app icon: looking for a surface.
  scanning: [
    'M3 8V5a2 2 0 0 1 2-2h3',
    'M16 3h3a2 2 0 0 1 2 2v3',
    'M21 16v3a2 2 0 0 1-2 2h-3',
    'M8 21H5a2 2 0 0 1-2-2v-3',
    'M7 14.5c1.5-1 3.2-1.5 5-1.5s3.5.5 5 1.5',
  ],
  // Target: tap here.
  tap: [
    'M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0',
    'M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0 -16 0',
  ],
  placed: [
    'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0',
    'M8 12.5l2.5 2.5L16 9.5',
  ],
  move: [
    'M5 9l-3 3 3 3',
    'M9 5l3-3 3 3',
    'M15 19l-3 3-3-3',
    'M19 9l3 3-3 3',
    'M2 12h20',
    'M12 2v20',
  ],
  warning: [
    'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
    'M12 9v4',
    'M12 17h.01',
  ],
}

/** Icon shown next to the AR hint, describing what is happening. */
export function ArStatusIcon({ name }: { name: ArStatusIconName }) {
  if (name === 'loading') {
    return <span className="spinner ar-icon" aria-hidden="true" />
  }
  return (
    <svg
      className={`ar-icon ar-icon-${name}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
