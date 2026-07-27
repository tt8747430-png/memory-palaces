import type { ReactNode } from 'react'

export interface LabelledFieldProps {
  label: string
  error?: string
  children: ReactNode
}

export function LabelledField({ label, error, children }: LabelledFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="px-1 text-(length:--p-text-label) font-medium text-muted-foreground">
        {label}
      </span>
      {children}
      {error ? (
        <span className="px-1 text-(length:--p-text-label) text-(--danger-on-surface)">
          {error}
        </span>
      ) : null}
    </label>
  )
}
