import type { ComponentProps } from 'react'
import { Field as FieldPrimitive } from '@base-ui/react/field'
import { cn } from '@/shared/lib'

type WithStringClass<T> = Omit<T, 'className'> & { className?: string }

function Field({ className, ...props }: WithStringClass<ComponentProps<typeof FieldPrimitive.Root>>) {
  return (
    <FieldPrimitive.Root data-slot="field" className={cn('flex flex-col gap-1.5', className)} {...props} />
  )
}

function FieldLabel({ className, ...props }: WithStringClass<ComponentProps<typeof FieldPrimitive.Label>>) {
  return (
    <FieldPrimitive.Label
      data-slot="field-label"
      className={cn('text-[length:var(--p-text-label)] font-medium text-heading', className)}
      {...props}
    />
  )
}

function FieldControl({
  className,
  ...props
}: WithStringClass<ComponentProps<typeof FieldPrimitive.Control>>) {
  return <FieldPrimitive.Control data-slot="field-control" className={className} {...props} />
}

function FieldDescription({
  className,
  ...props
}: WithStringClass<ComponentProps<typeof FieldPrimitive.Description>>) {
  return (
    <FieldPrimitive.Description
      data-slot="field-description"
      className={cn('text-[length:var(--p-text-label)] text-muted-foreground', className)}
      {...props}
    />
  )
}

function FieldError({ className, ...props }: WithStringClass<ComponentProps<typeof FieldPrimitive.Error>>) {
  return (
    <FieldPrimitive.Error
      data-slot="field-error"
      className={cn('text-[length:var(--p-text-label)] text-[var(--danger)]', className)}
      {...props}
    />
  )
}

export { Field, FieldLabel, FieldControl, FieldDescription, FieldError }
