import { createContext, use } from 'react'
import { type MotionValue, motionValue } from 'motion/react'

const FLAT: MotionValue<number> = motionValue(0)

export const HeaderElevationContext = createContext<MotionValue<number>>(FLAT)

export function useHeaderElevation(): MotionValue<number> {
  return use(HeaderElevationContext)
}
