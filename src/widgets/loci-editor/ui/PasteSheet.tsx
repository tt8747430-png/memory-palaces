import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button, Sheet, Textarea } from '@/shared/ui'

/** A bottom sheet that collects a block of pasted text and hands it to `onApply` — reused
 * for "paste a list" and "paste verses". The caller parses the text into cards. */
export function PasteSheet({
  open,
  onOpenChange,
  title,
  description,
  placeholder,
  applyLabel,
  onApply,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  placeholder: string
  applyLabel: string
  onApply: (text: string) => void
}) {
  const [text, setText] = useState('')

  useEffect(() => {
    if (open) setText('')
  }, [open])

  const valid = text.trim().length > 0

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <Button
          size="lg"
          className="w-full"
          disabled={!valid}
          onClick={() => valid && onApply(text)}
        >
          <Sparkles className="size-[18px]" aria-hidden />
          {applyLabel}
        </Button>
      }
    >
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={9}
        className="min-h-[200px] font-mono text-[length:var(--p-text-label)]"
        autoFocus
      />
    </Sheet>
  )
}
