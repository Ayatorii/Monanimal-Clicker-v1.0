import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Browser page zoom (Ctrl +/-) changes the effective CSS pixel width of the
    // viewport, which would flip a width-only breakpoint check mid-session and
    // cause desktop layouts to suddenly jump to mobile sizing. Gating on the
    // pointer/hover input capability (which zoom does not affect) keeps desktop
    // users on the desktop layout regardless of zoom level, while still
    // detecting real touch devices correctly.
    const widthMql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const coarsePointerMql = window.matchMedia("(pointer: coarse)")
    const compute = () => {
      setIsMobile(widthMql.matches && coarsePointerMql.matches)
    }
    widthMql.addEventListener("change", compute)
    coarsePointerMql.addEventListener("change", compute)
    compute()
    return () => {
      widthMql.removeEventListener("change", compute)
      coarsePointerMql.removeEventListener("change", compute)
    }
  }, [])

  return !!isMobile
}
