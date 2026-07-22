import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group'
import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import { cn } from '@/shared/lib'

type ToggleGroupProps<Value extends string> = Omit<ToggleGroupPrimitive.Props<Value>, 'className'> & {
  className?: string
}

/**
 * Single- or multi-select toggle group on Base UI — roving focus, arrow-key nav and
 * `aria-pressed` come for free. Membership is a `readonly Value[]` even for single-select
 * (`multiple` defaults to `false`, so at most one item is pressed). The group and its items
 * are intentionally near-unstyled: bespoke surfaces (segmented pills, colour swatches) own
 * their look via `className` and read the selected state from `data-[pressed]`.
 */
function ToggleGroup<Value extends string>({ className, ...props }: ToggleGroupProps<Value>) {
  return <ToggleGroupPrimitive data-slot="toggle-group" className={cn(className)} {...props} />
}

type ToggleGroupItemProps<Value extends string> = Omit<TogglePrimitive.Props<Value>, 'className'> & {
  className?: string
}

function ToggleGroupItem<Value extends string>({ className, ...props }: ToggleGroupItemProps<Value>) {
  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      className={cn(
        'outline-none transition-colors disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { ToggleGroup, ToggleGroupItem }
