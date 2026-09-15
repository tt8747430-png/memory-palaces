import { useMemo } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { AppProviders } from './providers/AppProviders'
import type { Services } from './composition-root'
import { createAppRouter } from './router'

export function App({ services }: { services: Services }) {
  // One router per object graph. `services` is built once by Bootstrap, so this memo runs once.
  const router = useMemo(() => createAppRouter(services), [services])
  return (
    <AppProviders services={services}>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
