import { type SyntheticEvent, useEffect, useRef, useState } from 'react'
import { Sheet } from './Sheet'
import { Input } from './primitives/input'
import { Button } from './primitives/button'

export interface PromptSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  fieldLabel: string
  /**
   * What the field answers with if the learner leaves it empty — a default name, the value being
   * edited. It is the placeholder, never text in the field: pre-filled text has to be selected to
   * be replaced, and a selection in a sheet is what iOS reveals by lifting the whole app
   * (CODE_STYLE §11). Typing starts fresh; confirming an empty field takes the suggestion.
   */
  suggestion?: string
  /** The hint for a field with nothing to suggest. */
  placeholder?: string
  confirmLabel: string
  onSubmit: (value: string) => void
}

export function PromptSheet({
  open,
  onOpenChange,
  title,
  description,
  fieldLabel,
  suggestion = '',
  placeholder,
  confirmLabel,
  onSubmit,
}: PromptSheetProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setValue('')
  }, [open])

  const answer = value.trim() || suggestion.trim()
  const submit = (event?: SyntheticEvent) => {
    event?.preventDefault()
    if (!answer) return
    onSubmit(answer)
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
        <Button size="lg" className="w-full" disabled={!answer} onClick={() => submit()}>
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
          placeholder={suggestion || placeholder}
          enterKeyHint="done"
          maxLength={60}
        />
      </form>
    </Sheet>
  )
}
