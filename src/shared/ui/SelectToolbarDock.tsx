import type { ReactNode } from 'react'
import { BottomDock } from './BottomDock'

export interface SelectToolbarDockProps {
  /** Selection is on. The dock stays mounted while it fades away, so it can be seen leaving. */
  open: boolean
  children: ReactNode
  className?: string
}

export function SelectToolbarDock({ open, children, className }: SelectToolbarDockProps) {
  return (
    <BottomDock open={open} className={className}>
      {children}
    </BottomDock>
  )
}
