import type { ReactNode } from 'react'

export interface SelectToolbarRowProps {
  children: ReactNode
}

/** The pill's inner row, shared by the live toolbar and the settings preview of it. */
export function SelectToolbarRow({ children }: SelectToolbarRowProps) {
  return (
    <div className="flex h-full w-full items-center justify-around gap-1.5 px-4">{children}</div>
  )
}
