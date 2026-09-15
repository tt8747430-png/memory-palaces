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

/** The overlay itself lives in `Bootstrap`, above the services boundary; this only reads whether
 *  it has lifted, so nothing behind it can be focused or touched while it is up. */
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
        {/* Once, for every route: Autosync can stop to ask from any screen, and a question that
            only had a dialog on three of them would wait unseen on the rest. */}
        <SyncReviewDialog />
      </div>
      <ProbeOverlay />
      <Suspense>
        <Devtools />
      </Suspense>
    </>
  )
}
