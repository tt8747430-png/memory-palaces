import { AppScreen } from './AppScreen'
import { Skeleton } from './Skeleton'

export function ScreenLoading() {
  return (
    <AppScreen className="items-center justify-center">
      <Skeleton className="size-8 bg-secondary" />
    </AppScreen>
  )
}
