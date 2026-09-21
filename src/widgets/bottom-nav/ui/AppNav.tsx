import { type ComponentType } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { House, User } from 'lucide-react'
import { type RoutePath, ROUTES } from '@/shared/config/routes'
import { cn, useAppNavHidden } from '@/shared/lib'
import { BottomDock, DockPill } from '@/shared/ui'

interface Tab {
  to: typeof ROUTES.home | typeof ROUTES.profile
  Icon: ComponentType<{ className?: string }>
  labelKey: 'nav.home' | 'nav.profile'
}

const TABS: Tab[] = [
  { to: ROUTES.home, Icon: House, labelKey: 'nav.home' },
  { to: ROUTES.profile, Icon: User, labelKey: 'nav.profile' },
]

const TAB_PATHS = TABS.map((tab) => tab.to) as RoutePath[]

const navySpring = { type: 'spring', stiffness: 500, damping: 40, mass: 0.6 } as const

export function AppNav() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const hidden = useAppNavHidden()
  const showNav = TAB_PATHS.includes(pathname as RoutePath) && !hidden

  return (
    <BottomDock open={showNav}>
      <nav aria-label={t('nav.label')} className="h-full w-full">
        <DockPill className="justify-around px-4">
          {TABS.map(({ to, Icon, labelKey }) => {
            const isActive = pathname === to
            return (
              <motion.button
                key={to}
                type="button"
                onClick={() => void navigate({ to })}
                aria-current={isActive ? 'page' : undefined}
                whileTap={{ scale: 0.92 }}
                className="relative flex h-full min-w-18 items-center justify-center"
              >
                {isActive ? (
                  <motion.span
                    layoutId="navPill"
                    transition={navySpring}
                    aria-hidden
                    className="absolute size-12 rounded-squircle bg-(--nav-pill) shadow-[inset_0_2px_8px_rgba(0,0,0,0.12),inset_0_-2px_6px_rgba(255,255,255,0.25)]"
                  />
                ) : null}
                <span className="relative z-10 flex flex-col items-center gap-1">
                  <Icon
                    className={cn(
                      'size-6',
                      isActive ? 'text-(--nav-ink-active)' : 'text-(--nav-ink)',
                    )}
                  />
                  <span
                    className={cn(
                      'text-tiny font-medium',
                      isActive ? 'text-(--nav-ink-active)' : 'text-(--nav-ink)/75',
                    )}
                  >
                    {t(labelKey)}
                  </span>
                </span>
              </motion.button>
            )
          })}
        </DockPill>
      </nav>
    </BottomDock>
  )
}
