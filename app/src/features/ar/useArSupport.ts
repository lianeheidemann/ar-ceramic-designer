import { useEffect, useState } from 'react'
import { checkArSupport, type ArSupport } from './support'

/** Checks once whether immersive AR is available in this browser. */
export function useArSupport(): ArSupport {
  const [support, setSupport] = useState<ArSupport>({ kind: 'checking' })
  useEffect(() => {
    let cancelled = false
    checkArSupport().then((result) => !cancelled && setSupport(result))
    return () => {
      cancelled = true
    }
  }, [])
  return support
}
