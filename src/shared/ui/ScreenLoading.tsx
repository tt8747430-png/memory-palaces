import { AppScreen } from './AppScreen'
import { Skeleton } from './Skeleton'

/** The whole-screen wait a route shows before its stores have emitted. */
export function ScreenLoading() {
  return (
    <AppScreen className="items-center justify-center">
      <Skeleton className="size-8 bg-secondary" />
    </AppScreen>
  )
}
