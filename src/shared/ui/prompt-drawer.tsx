import { type FormEvent, type ReactNode, useState } from 'react'
import { openOverlay, useOverlayController, type OverlayResolver } from './overlay-host'
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from './drawer'
import { Button } from './button'
import { cn } from '@/shared/lib'

export interface PromptDrawerOptions {
  title: ReactNode
  label?: string
  initialValue?: string
  placeholder?: string
  confirmLabel?: string
  validate?: (value: string) => string | null
}

/**
 * Opens a controlled Drawer with a single text field that starts open and resolves the
 * trimmed value on submit, or `null` on cancel/dismiss. Lives in a Drawer (not a Dialog) so
 * `VirtualKeyboardProvider` lifts the field above the software keyboard automatically. The
 * input renders at `--ms-text-title` (16px) rather than the smaller body size to kill iOS
 * Safari's focus-zoom, which triggers below 16px.
 */
export function openPromptDrawer(options: PromptDrawerOptions): Promise<string | null> {
  return openOverlay<string | null>((resolve) => (
    <PromptDrawerBody {...options} resolve={resolve} />
  ))
}

function PromptDrawerBody({
  title,
  label,
  initialValue = '',
  placeholder,
  confirmLabel = 'Save',
  validate,
  resolve,
}: PromptDrawerOptions & { resolve: OverlayResolver<string | null> }) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  const { open, close, onOpenChangeComplete } = useOverlayController(resolve)

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    const trimmed = value.trim()
    if (trimmed.length === 0) return
    const validationError = validate?.(trimmed) ?? null
    if (validationError) {
      setError(validationError)
      return
    }
    close(trimmed)
  }

  const valid = value.trim().length > 0

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) close(null)
      }}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={submit} className="px-4 pt-1.5 pb-2">
          <label className="sr-only" htmlFor="prompt-drawer-field">
            {label ?? title}
          </label>
          <input
            id="prompt-drawer-field"
            autoFocus
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              setError(null)
            }}
            placeholder={placeholder}
            aria-label={label}
            aria-invalid={error != null}
            enterKeyHint="done"
            maxLength={60}
            className={cn(
              'h-11 w-full rounded-control border border-border bg-card px-3.5',
              'text-[length:var(--ms-text-title)] text-foreground placeholder:text-muted-foreground',
              'transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          />
          {error ? (
            <p className="mt-1.5 text-[length:var(--ms-text-label)] text-destructive">{error}</p>
          ) : null}
        </form>
        <DrawerFooter>
          <Button size="lg" className="w-full" disabled={!valid} onClick={() => submit()}>
            {confirmLabel}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
