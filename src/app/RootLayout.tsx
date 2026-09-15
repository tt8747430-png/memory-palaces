import { lazy, Suspense, useEffect } from 'react'
import { Outlet } from '@tanstack/react-router'
import { useKeyboardInset, useSplashStore } from '@/shared/lib'
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
  const splashDone = useSplashStore((state) => state.done)
  useKeyboardInset()

  useEffect(() => {
    if (splashDone) return
    const active = document.activeElement
    if (active instanceof HTMLElement && active !== document.body) active.blur()
  }, [splashDone])

  return (
    <>
      <div inert={!splashDone} className="contents">
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
