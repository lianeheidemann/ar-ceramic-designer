import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

/** Line icon drawn with `currentColor`; decorative (hidden from screen readers). */
function Svg({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

export function CubeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <>
        <path d="M12 3 4 7.5v9L12 21l8-4.5v-9Z" />
        <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
      </>
    </Svg>
  )
}

export function PaletteIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <>
        <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.7 1.8-1.7H16a5 5 0 0 0 5-5C21 6.4 17 3 12 3Z" />
        <circle cx="7.5" cy="11.5" r="1" />
        <circle cx="10" cy="7.5" r="1" />
        <circle cx="14.5" cy="7.5" r="1" />
      </>
    </Svg>
  )
}

export function CameraIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <>
        <path d="M4 8h3l2-3h6l2 3h3v11H4Z" />
        <circle cx="12" cy="13" r="3.5" />
      </>
    </Svg>
  )
}

export function ResetIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 3v5h5" />
      </>
    </Svg>
  )
}

export function ArIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <>
        <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
        <path d="m12 7-4.5 2.5v5L12 17l4.5-2.5v-5Z" />
        <path d="m7.5 9.5 4.5 2.5 4.5-2.5M12 12v5" />
      </>
    </Svg>
  )
}

export function UploadIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <>
        <path d="M7 18a5 5 0 0 1-.9-9.9A6 6 0 0 1 17.7 9 4.5 4.5 0 0 1 17 18" />
        <path d="M12 12v8M9 15l3-3 3 3" />
      </>
    </Svg>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m9 6 6 6-6 6" />
    </Svg>
  )
}

export function ChevronUpIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 15 6-6 6 6" />
    </Svg>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  )
}

export function RulerIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <>
        <path d="M4 20V4h5v11h11v5Z" />
        <path d="M4 8h2M4 12h2M12 20v-2M16 20v-2" />
      </>
    </Svg>
  )
}

export function ExpandIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <>
        <path d="M15 3h6v6M9 21H3v-6" />
        <path d="m21 3-7 7M3 21l7-7" />
      </>
    </Svg>
  )
}

export function DocumentIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <>
        <path d="M14 3H6v18h12V7Z" />
        <path d="M14 3v4h4M9 12h6M9 16h6" />
      </>
    </Svg>
  )
}

export function SunIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </>
    </Svg>
  )
}

export function MoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z" />
    </Svg>
  )
}
