import type { ReactNode } from 'react'
import { AuthLogo } from './AuthLogo'

export interface AuthHeaderProps {
  title: string
  subtitle: string
  mark?: ReactNode
}

export function AuthHeader({ title, subtitle, mark }: AuthHeaderProps) {
  return (
    <header className="flex flex-col items-center gap-4 text-center">
      {mark ?? <AuthLogo className="size-16" />}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-balance text-headline font-bold tracking-tight text-heading">
          {title}
        </h1>
        <p className="text-pretty text-muted-foreground">{subtitle}</p>
      </div>
    </header>
  )
}

export interface AuthSwitchLinkProps {
  prompt: string
  label: string
  onClick: () => void
}

export function AuthSwitchLink({ prompt, label, onClick }: AuthSwitchLinkProps) {
  return (
    <>
      {prompt}{' '}
      <button
        type="button"
        onClick={onClick}
        className="-my-2 rounded-control px-1.5 py-2 font-semibold text-heading transition-colors active:bg-primary/4"
      >
        {label}
      </button>
    </>
  )
}
