import { use } from 'react'
import { Navigate, Outlet } from '@tanstack/react-router'
import { type ExtensionId, ExtensionServicesContext, isExtensionActive } from '@/shared/lib'
import { extensionSettings } from './extension-redirect'

/**
 * The layout every one of an extension's routes renders inside. The route guard has already
 * answered on the way in; this answers while the learner stays — switched off from another tab, the
 * extension's services go in the same render its screen would read them, so the screen is swapped
 * for Settings rather than left to throw.
 */
export function ExtensionGate({ id }: { id: ExtensionId }) {
  const active = isExtensionActive(use(ExtensionServicesContext), id)
  return active ? <Outlet /> : <Navigate {...extensionSettings(id)} replace />
}
