import { clamp01 } from '../number'

export function barElevation(y: number, distance: number): number {
  return clamp01(y / distance)
}
