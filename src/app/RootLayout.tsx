import { lazy, Suspense, useEffect } from 'react'
import { Outlet } from '@tanstack/react-router'
import { AnimatePresence } from 'motion/react'
import { useKeyboardInset, useSplashStore } from '@/shared/lib'
import { AppNav } from '@/widgets/bottom-nav'
import { SplashOverlay } from '@/widgets/splash'

const Devtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-router-devtools').then((m) => ({
        default: m.TanStackRouterDevtools,
      })),
    )
  : () => null

export function RootLayout() {
  const splashDone = useSplashStore((state) => state.done)
  const finishSplash = useSplashStore((state) => state.finish)
  useKeyboardInset()

  useEffect(() => {
    if (splashDone) return
    const active = document.activeElement
    if (active instanceof HTMLElement && active !== document.body) active.blur()
  }, [splashDone])

  return (
    <>
      <div
        aria-hidden
        data-slot="status-cap"
        className="pointer-events-none fixed inset-x-0 top-0 z-1000000000 bg-primary"
        style={{ height: 'env(safe-area-inset-top)' }}
      />
      <div inert={!splashDone} className="contents">
        <Outlet />
        <AppNav />
      </div>
      <AnimatePresence>
        {splashDone ? null : <SplashOverlay onDone={finishSplash} />}
      </AnimatePresence>
      <Suspense>
        <Devtools />
      </Suspense>
    </>
  )
}
