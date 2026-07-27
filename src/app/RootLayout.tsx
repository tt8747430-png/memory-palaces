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

  // Nothing behind the splash may hold focus: a route that mounts an email or password field
  // under the overlay would otherwise open the on-screen keyboard over a brand moment the
  // learner hasn't finished watching. `inert` both blocks new focus and drops what is focused,
  // but it only applies to elements that exist when it lands — so anything the browser
  // restored before this mounted is blurred explicitly.
  useEffect(() => {
    if (splashDone) return
    const active = document.activeElement
    if (active instanceof HTMLElement && active !== document.body) active.blur()
  }, [splashDone])

  return (
    <>
      {/* `position: fixed` anchors to the layout viewport, which iOS leaves behind when the
          keyboard slides the visual viewport down — so this rides the same `--vv-top` offset as
          `#root` and stays capping the status area. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-[var(--vv-top)] z-1000000000 bg-primary"
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
