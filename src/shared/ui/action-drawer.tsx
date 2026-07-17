import type { ReactNode } from 'react'
import { openOverlay } from './overlay-host'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from './drawer'
import { cn } from '@/shared/lib'

export interface ActionDrawerAction {
  id: string
  label: ReactNode
  icon?: ReactNode
  tone?: 'default' | 'danger'
}

export interface ActionDrawerOptions {
  title?: ReactNode
  actions: ActionDrawerAction[]
}

/**
 * Opens a controlled Drawer listing `actions` as rows plus a Cancel row, starting open and
 * resolving the chosen action's `id` on select, or `null` on cancel/dismiss (backdrop click,
 * swipe, Escape).
 */
export function openActionDrawer(options: ActionDrawerOptions): Promise<string | null> {
  const { title, actions } = options

  return openOverlay<string | null>((resolve) => (
    <Drawer
      open
      onOpenChange={(open) => {
        if (!open) resolve(null)
      }}
    >
      <DrawerContent>
        {title ? (
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
        ) : null}
        <div className="flex flex-col gap-0.5 px-2 pt-1 pb-2">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => resolve(action.id)}
              className={cn(
                'flex h-12 items-center gap-3 rounded-control px-3 text-left',
                'text-[length:var(--ms-text-body)] font-medium transition-transform duration-150 ease-out active:scale-[0.99]',
                action.tone === 'danger'
                  ? 'text-destructive hover:bg-destructive/10'
                  : 'text-heading hover:bg-info-surface',
              )}
            >
              {action.icon ? (
                <span className="grid size-5 shrink-0 place-items-center" aria-hidden>
                  {action.icon}
                </span>
              ) : null}
              {action.label}
            </button>
          ))}
        </div>
        <DrawerFooter>
          <DrawerClose
            className={cn(
              'flex h-12 items-center justify-center rounded-control bg-info-surface',
              'text-[length:var(--ms-text-body)] font-semibold text-heading',
              'transition-transform duration-150 ease-out active:scale-[0.99]',
            )}
          >
            Cancel
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ))
}
