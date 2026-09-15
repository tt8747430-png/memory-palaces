import { useMemo } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { AppProviders } from './providers/AppProviders'
import type { Services } from './composition-root'
import { createAppRouter } from './router'

export function App({ services }: { services: Services }) {
  const router = useMemo(() => createAppRouter(services), [services])
  return (
    <AppProviders services={services}>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
