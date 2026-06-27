import type { ElementType } from 'react'
import { motion, useReducedMotion } from 'motion/react'

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

export interface WordRevealProps {
  text: string
  className?: string
  /** Seconds before the first word begins. */
  delay?: number
  /** Per-word stagger, in seconds. */
  stagger?: number
  /** Wrapper element — use `h1`/`h2`/`p` to keep the line semantic. */
  as?: 'span' | 'p' | 'h1' | 'h2'
}

/**
 * Brand-moment text: reveals a line one word at a time, each word rising and
 * unblurring into place. i18n-safe — it splits the already-translated string on
 * whitespace, so word count and order follow the active locale. Reduced motion
 * collapses to a single crossfade of the whole line.
 */
export function WordReveal({
  text,
  className,
  delay = 0,
  stagger = 0.08,
  as = 'span',
}: WordRevealProps) {
  const reduce = useReducedMotion()
  const Tag = as as ElementType
  const words = text.split(/\s+/).filter(Boolean)

  if (reduce) {
    return (
      <Tag className={className}>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay, duration: 0.4 }}
        >
          {text}
        </motion.span>
      </Tag>
    )
  }

  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, i) => (
        <span key={i} aria-hidden>
          <motion.span
            className="inline-block"
            initial={{ y: '0.5em', opacity: 0, filter: 'blur(8px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            transition={{ delay: delay + i * stagger, duration: 0.6, ease: EASE_OUT_EXPO }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  )
}
