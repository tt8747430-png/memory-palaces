import type { ReactNode } from 'react'
import { AppHeader } from './AppHeader'
import { HeaderBack, HeaderBar, HeaderHeading, HeaderSubtitle, HeaderTitle } from './Header'
import { HeaderChrome } from './HeaderChrome'
import { HeaderSearch } from './HeaderSearch'
import { backProps, type HeaderBackProps } from './header-context'

export type ScreenHeaderProps = {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  /** A field that takes the whole bar while it is here; the rest comes back when it goes. */
  search?: ReactNode
  className?: string
} & HeaderBackProps

export function ScreenHeader(props: ScreenHeaderProps) {
  const { title, subtitle, action, search, className } = props
  return (
    <AppHeader {...backProps(props)} title={title} subtitle={subtitle} search={search}>
      <HeaderBar className={className}>
        <HeaderChrome>
          <HeaderBack />
          <HeaderHeading>
            <HeaderTitle />
            <HeaderSubtitle className="text-muted-foreground" />
          </HeaderHeading>
          {action}
        </HeaderChrome>
        <HeaderSearch />
      </HeaderBar>
    </AppHeader>
  )
}
