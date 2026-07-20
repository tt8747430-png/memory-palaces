import { createContext, useContext, type ReactNode } from 'react'
import type { Services } from '@/composition-root'

const ServicesContext = createContext<Services | null>(null)

export function ServicesProvider({
  services,
  children,
}: {
  services: Services
  children: ReactNode
}) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
}

/** The DI seam. Components and VM hooks reach the model layer only through this. */
export function useServices(): Services {
  const services = useContext(ServicesContext)
  if (!services) throw new Error('useServices must be used within a ServicesProvider')
  return services
}
