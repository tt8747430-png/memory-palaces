import type { ReactNode } from 'react'
import { Navigate } from '@tanstack/react-router'
import { selectExtensionFeature, usePreferencesStore } from '@/entities/preferences'
import type { ExtensionManifest } from '@/shared/lib'
import { extensionOverview } from './extension-redirect'

export interface FeatureGateProps {
  manifest: ExtensionManifest
  feature: string
  children: ReactNode
}

/**
 * Wraps a route that belongs to one of an extension's features. The route guard has already
 * answered on the way in; this answers while the learner stays — a feature switched off from the
 * overview, or by a quiet pull from another device, withdraws the screen in the same render rather
 * than leaving it mounted over a setting that says it is gone.
 */
export function FeatureGate({ manifest, feature, children }: FeatureGateProps) {
  const on = usePreferencesStore(selectExtensionFeature(manifest.id, feature))
  return on ? children : <Navigate {...extensionOverview(manifest)} replace />
}
