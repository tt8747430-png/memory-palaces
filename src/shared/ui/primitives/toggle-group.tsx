import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group'
import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import { cn } from '@/shared/lib'

type ToggleGroupProps<Value extends string> = Omit<
  ToggleGroupPrimitive.Props<Value>,
  'className'
> & {
  className?: string
}

function ToggleGroup<Value extends string>({ className, ...props }: ToggleGroupProps<Value>) {
  return <ToggleGroupPrimitive data-slot="toggle-group" className={cn(className)} {...props} />
}

type ToggleGroupItemProps<Value extends string> = Omit<
  TogglePrimitive.Props<Value>,
  'className'
> & {
  className?: string
}

function ToggleGroupItem<Value extends string>({
  className,
  ...props
}: ToggleGroupItemProps<Value>) {
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
