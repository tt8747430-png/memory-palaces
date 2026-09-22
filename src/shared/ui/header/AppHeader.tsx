import { motion } from 'motion/react'
import { cn, useHeaderElevation } from '@/shared/lib'
import { Header, type HeaderProps } from './Header'

/**
 * The bar is the status bar, continued: the page runs under the translucent bar (ADR 0006), and
 * `pt-safe` carries `.chrome` up under the clock, so the two are one block with no seam. `.chrome`
 * redeclares the ink for everything inside, which is why no child here names a colour of its own.
 */
const CHROME = 'relative z-(--z-header) shrink-0 chrome'

function HeaderLift() {
  const elevation = useHeaderElevation()
  return (
    <motion.span
      aria-hidden
      style={{ opacity: elevation }}
      className="pointer-events-none absolute inset-0 border-b border-border shadow-rest"
    />
  )
}

export function AppHeader(props: HeaderProps) {
  return (
    <Header {...props} className={cn(CHROME, props.className)}>
      <HeaderLift />
      {props.children}
    </Header>
  )
}
