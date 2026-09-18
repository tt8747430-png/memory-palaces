import { createContext, use } from 'react'
import type { ExtensionContributions, ExtensionPoint } from './extension-manifest'

const EMPTY: ExtensionContributions = {}

export const ExtensionPointsContext = createContext<ExtensionContributions>(EMPTY)

const NONE: never[] = []

export function useExtensionPoint<Point extends ExtensionPoint>(
  point: Point,
): NonNullable<ExtensionContributions[Point]> {
  const contributions = use(ExtensionPointsContext)
  return (contributions[point] ?? NONE) as NonNullable<ExtensionContributions[Point]>
}
