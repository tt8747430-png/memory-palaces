import type { ReactNode } from 'react'
import { AuthLogo } from './AuthLogo'

export interface AuthHeaderProps {
  title: string
  subtitle: string
  /** Stands in for the logo when the screen has reached a different moment. */
  mark?: ReactNode
}

/** The mark, the title and the line under it — the same on every way in. */
export function AuthHeader({ title, subtitle, mark }: AuthHeaderProps) {
  return (
    <>
      {mark ?? <AuthLogo className="size-16" />}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-balance text-(length:--p-text-headline) font-bold tracking-tight text-heading">
          {title}
        </h1>
        <p className="text-pretty text-muted-foreground">{subtitle}</p>
      </div>
    </>
  )
}

export interface AuthSwitchLinkProps {
  /** "Don't have an account?" — the question the link answers. */
  prompt: string
  label: string
  onClick: () => void
}

/** The line pointing at the other entrance. */
export function AuthSwitchLink({ prompt, label, onClick }: AuthSwitchLinkProps) {
  return (
    <>
      {prompt}{' '}
      <button type="button" onClick={onClick} className="font-semibold text-heading">
        {label}
      </button>
    </>
  )
}
