import type { ElementType } from 'react'
import { motion, useReducedMotion } from 'motion/react'

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

export interface WordRevealProps {
  text: string
  className?: string
  delay?: number
  stagger?: number
  as?: 'span' | 'p' | 'h1' | 'h2'
}

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
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  )
}
