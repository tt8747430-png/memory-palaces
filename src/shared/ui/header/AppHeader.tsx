import { motion } from 'motion/react'
import { cn, useHeaderElevation } from '@/shared/lib'
import { Header, type HeaderProps } from './Header'

const GLASS = 'relative z-(--z-header) shrink-0 bg-glass'

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
    <Header {...props} className={cn(GLASS, props.className)}>
      <HeaderLift />
      {props.children}
    </Header>
  )
}
