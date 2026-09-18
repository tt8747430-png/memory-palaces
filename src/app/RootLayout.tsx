import { lazy, Suspense, useEffect } from 'react'
import { Outlet } from '@tanstack/react-router'
import { useKeyboardInset, useSplashShown } from '@/shared/lib'
import { AppNav } from '@/widgets/bottom-nav'
import { ProbeOverlay } from '@/widgets/dev-probe'
import { SyncReviewDialog } from '@/widgets/sync'

const Devtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-router-devtools').then((m) => ({
        default: m.TanStackRouterDevtools,
      })),
    )
  : () => null

export function RootLayout() {
  const splashShown = useSplashShown()
  useKeyboardInset()

  useEffect(() => {
    if (!splashShown) return
    const active = document.activeElement
    if (active instanceof HTMLElement && active !== document.body) active.blur()
  }, [splashShown])

  return (
    <>
      <div inert={splashShown} className="contents">
        <Outlet />
        <AppNav />
        <SyncReviewDialog />
      </div>
      <ProbeOverlay />
      <Suspense>
        <Devtools />
      </Suspense>
    </>
  )
}
