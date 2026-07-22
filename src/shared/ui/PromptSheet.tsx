import { type SyntheticEvent, useEffect, useRef, useState } from 'react'
import { useAutoSelect } from '@/shared/lib'
import { Sheet } from './Sheet'
import { Input } from './primitives/input'
import { Button } from './primitives/button'

export interface PromptSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  fieldLabel: string
  placeholder?: string
  initialValue?: string
  confirmLabel: string
  onSubmit: (value: string) => void
}

export function PromptSheet({
  open,
  onOpenChange,
  title,
  description,
  fieldLabel,
  placeholder,
  initialValue = '',
  confirmLabel,
  onSubmit,
}: PromptSheetProps) {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const autoSelect = useAutoSelect<HTMLInputElement>(open)

  useEffect(() => {
    if (open) setValue(initialValue)
  }, [open, initialValue])

  const valid = value.trim().length > 0
  const submit = (event?: SyntheticEvent) => {
    event?.preventDefault()
    if (!valid) return
    onSubmit(value.trim())
    onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      initialFocus={inputRef}
      footer={
        <Button size="lg" className="w-full" disabled={!valid} onClick={() => submit()}>
          {confirmLabel}
        </Button>
      }
    >
      <form onSubmit={submit} className="pb-2">
        <Input
          ref={inputRef}
          aria-label={fieldLabel}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={autoSelect}
          placeholder={placeholder}
          enterKeyHint="done"
          maxLength={60}
        />
      </form>
    </Sheet>
  )
}
