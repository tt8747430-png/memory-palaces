import { useId } from 'react'
import { motion, type TargetAndTransition, useReducedMotion, type Variants } from 'motion/react'
import {
  archPath,
  type Bar,
  MARK,
  MARK_BOX,
  MARK_PAINT,
  pedimentPath,
  type RadialPaint,
} from '@/shared/config/brand-mark'
import { EASE_EXPO } from '@/shared/lib'

/**
 * `build` raises the palace from the steps up and then lights the door — for a screen that opens on
 * it. `none` draws it whole from the first frame, as the launch screen left it.
 */
export type ThresholdEntrance = 'build' | 'none'

export interface ThresholdProps {
  entrance: ThresholdEntrance
  className?: string
}

/** Each piece settles in its turn, from the ground up. */
function settle(from: TargetAndTransition, turn: number, duration = 0.6): Variants {
  return {
    hidden: from,
    shown: {
      opacity: 1,
      y: 0,
      scaleY: 1,
      transition: { delay: 0.1 + turn * 0.09, duration, ease: EASE_EXPO },
    },
  }
}

const STEP = settle({ opacity: 0, y: 8 }, 0)
const COLUMN = settle({ opacity: 0, scaleY: 0 }, 1)
const CAPITAL = settle({ opacity: 0, y: -6 }, 2)
const BEAM = settle({ opacity: 0, y: -8 }, 3)
const PEDIMENT = settle({ opacity: 0, y: -12 }, 4)
const DOOR = settle({ opacity: 0 }, 6, 0.9)
const GLOW = settle({ opacity: 0 }, 7, 1.1)

/** After the door is lit, its warmth rises and falls — the palace is awake. */
const BREATH: TargetAndTransition = { scale: [1, 1.14, 1], opacity: [1, 0.72, 1] }
const BREATH_PACE = { duration: 3.6, repeat: Infinity, ease: 'easeInOut' } as const

function Radial({ id, paint }: { id: string; paint: RadialPaint }) {
  return (
    <radialGradient id={id} cx={paint.cx} cy={paint.cy} r={paint.r} gradientUnits="userSpaceOnUse">
      {paint.stops.map(([offset, color, opacity]) => (
        <stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
      ))}
    </radialGradient>
  )
}

function Stone({ bar, variants }: { bar: Bar; variants: Variants }) {
  return (
    <motion.rect
      x={bar.x}
      y={bar.y}
      width={bar.width}
      height={bar.height}
      rx={bar.rx}
      fill={MARK_PAINT.stone}
      variants={variants}
      style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
    />
  )
}

/** The Mindscape mark, drawn from `MARK` — the same drawing the app icon and launch screens carry. */
export function Threshold({ entrance, className }: ThresholdProps) {
  const reduce = useReducedMotion()
  const id = useId().replace(/[^\w-]/g, '')
  const build = entrance === 'build' && !reduce
  const { pediment, beam, capitals, columns, door, steps } = MARK
  const { glow } = MARK_PAINT

  return (
    <motion.svg
      viewBox={`0 0 ${MARK_BOX} ${MARK_BOX}`}
      className={className}
      role="img"
      aria-label="Mindscape"
      initial={build ? 'hidden' : 'shown'}
      animate="shown"
    >
      <defs>
        <Radial id={`${id}-glow`} paint={glow} />
        <Radial id={`${id}-light`} paint={MARK_PAINT.light} />
      </defs>

      <motion.g variants={GLOW}>
        <motion.circle
          cx={glow.cx}
          cy={glow.cy}
          r={glow.r}
          fill={`url(#${id}-glow)`}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          animate={reduce ? undefined : BREATH}
          transition={{ ...BREATH_PACE, delay: build ? 1.4 : 0.4 }}
        />
      </motion.g>
      <motion.path
        d={pedimentPath(pediment)}
        fill={MARK_PAINT.stone}
        stroke={MARK_PAINT.stone}
        strokeWidth={pediment.round}
        strokeLinejoin="round"
        variants={PEDIMENT}
      />
      <Stone bar={beam} variants={BEAM} />
      {capitals.map((capital) => (
        <Stone key={capital.x} bar={capital} variants={CAPITAL} />
      ))}
      {columns.map((column) => (
        <Stone key={column.x} bar={column} variants={COLUMN} />
      ))}
      <motion.path d={archPath(door)} fill={`url(#${id}-light)`} variants={DOOR} />
      {steps.map((step) => (
        <Stone key={step.y} bar={step} variants={STEP} />
      ))}
    </motion.svg>
  )
}
