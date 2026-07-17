import { RouterProvider } from 'react-router/dom'
import { Toaster } from 'sonner'
import { ServicesProvider } from '@/shell/services-provider'
import type { Services } from '@/composition-root'
import { router } from '@/routes'
import { OverlayHost } from '@/shared/ui'

export function App({ services }: { services: Services }) {
  return (
    <ServicesProvider services={services}>
      <RouterProvider router={router} />
      <OverlayHost />
      <Toaster />
    </ServicesProvider>
  )
}
