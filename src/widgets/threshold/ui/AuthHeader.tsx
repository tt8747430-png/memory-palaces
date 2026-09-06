import type { ReactNode } from 'react'
import { AuthLogo } from './AuthLogo'

export interface AuthHeaderProps {
  title: string
  subtitle: string
  /** Stands in for the logo when the screen has reached a different moment. */
  mark?: ReactNode
}

/**
 * The mark, the title and the line under it — the same on every way in.
 *
 * It owns the `<header>` element and the column that centres it. It used to return a bare fragment,
 * so each of its five callers decided for itself: two wrapped it (`AuthForm` in a `motion.header`,
 * the forgot-password screen in the only hand-rolled `<header>` in `src/pages` — CODE_STYLE §4a)
 * and three let its children fall straight into their own flex column at a different gap.
 */
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
  /** "Don't have an account?" — the question the link answers. */
  prompt: string
  label: string
  onClick: () => void
}

/**
 * The line pointing at the other entrance.
 *
 * The button sits inside a sentence, so it cannot be a 44px-tall block without breaking the line —
 * `py-2` plus `-my-2` grows the hit box past the floor while leaving the text where it was.
 */
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
