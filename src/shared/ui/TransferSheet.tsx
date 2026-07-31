import type { ReactNode } from 'react'
import { ImportRow, type ImportRowTone } from './ImportRow'
import { Sheet } from './Sheet'

export interface TransferOption {
  id: string
  icon: ReactNode
  title: string
  subtitle: string
  onSelect: () => void
  tone?: ImportRowTone
  badge?: ReactNode
  trailing?: ReactNode
  disabled?: boolean
}

export interface TransferSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  options: TransferOption[]
}

/**
 * A sheet offering a short list of ways to move content in or out. Choosing an option dismisses the
 * sheet first, so the picker or page it opens is never stacked behind it.
 */
export function TransferSheet({
  open,
  onOpenChange,
  title,
  description,
  options,
}: TransferSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <div className="flex flex-col gap-2.5 pb-2">
        {options.map(({ id, onSelect, ...row }) => (
          <ImportRow
            key={id}
            {...row}
            onClick={() => {
              onOpenChange(false)
              onSelect()
            }}
          />
        ))}
      </div>
    </Sheet>
  )
}
