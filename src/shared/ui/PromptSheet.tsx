import { type SyntheticEvent, useEffect, useState } from 'react'
import { Sheet } from './Sheet'
import { TextField } from './TextField'
import { Button } from './button'

export interface PromptSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** Optional supporting line under the title (e.g. "Subdeck of Biblia"). */
  description?: string
  /** Accessible name for the single input. */
  fieldLabel: string
  placeholder?: string
  /** Seed value (edit/rename flows); defaults to empty. */
  initialValue?: string
  confirmLabel: string
  onSubmit: (value: string) => void
}

/** A one-field bottom sheet: a name input plus a primary confirm. The single write-path for
 * "give it a name" flows — create a deck, a subdeck, rename — so those never fire with a
 * placeholder name and the user always gets a keyboard. Trims on submit; the confirm stays
 * disabled until there's a non-empty name. Re-seeds each time it opens. */
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
      footer={
        <Button size="lg" className="w-full" disabled={!valid} onClick={() => submit()}>
          {confirmLabel}
        </Button>
      }
    >
      <form onSubmit={submit} className="pb-2">
        <TextField
          aria-label={fieldLabel}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          autoFocus
          enterKeyHint="done"
          maxLength={60}
        />
      </form>
    </Sheet>
  )
}
