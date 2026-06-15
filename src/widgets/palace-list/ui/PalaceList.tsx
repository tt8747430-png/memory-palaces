import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { Copy, Pencil, Trash2 } from 'lucide-react'
import type { Palace } from '@/entities/palace'
import { cn } from '@/shared/lib'
import { Button, cardSurface, IconButton, TextField } from '@/shared/ui'

export interface PalaceListProps {
  palaces: Palace[]
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  /** Open the palace's detail. Omitted in contexts without navigation (e.g. tests). */
  onOpen?: (id: string) => void
}

/** Presentational list of palaces. Reads nothing from the store — the page passes
 * data and wires the commands — so it stays reusable and easy to test. */
export function PalaceList({ palaces, onRename, onDelete, onDuplicate, onOpen }: PalaceListProps) {
  const { t } = useTranslation()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  if (palaces.length === 0) {
    return (
      <p className="rounded-card bg-card-glass p-6 text-center shadow-rest">{t('palaces.empty')}</p>
    )
  }

  const startEdit = (palace: Palace) => {
    setEditingId(palace.id)
    setDraft(palace.name)
  }

  const commitEdit = (id: string) => {
    const name = draft.trim()
    if (name) onRename(id, name)
    setEditingId(null)
  }

  return (
    <ul className="flex flex-col gap-3">
      {palaces.map((palace) => (
        <motion.li
          key={palace.id}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(cardSurface, 'px-3 py-2.5')}
        >
          {editingId === palace.id ? (
            <div className="flex items-center gap-2">
              <TextField
                aria-label={t('palaces.renameLabel', { name: palace.name })}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && commitEdit(palace.id)}
                autoFocus
              />
              <Button size="sm" onClick={() => commitEdit(palace.id)}>
                {t('palaces.save')}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <PalaceSummary
                palace={palace}
                onOpen={onOpen}
                openLabel={t('palaces.openLabel', { name: palace.name })}
              />
              <div className="ml-auto flex shrink-0 items-center gap-0.5">
                <IconButton
                  size="sm"
                  aria-label={t('palaces.renameLabel', { name: palace.name })}
                  onClick={() => startEdit(palace)}
                >
                  <Pencil className="size-4" aria-hidden />
                </IconButton>
                <IconButton
                  size="sm"
                  aria-label={t('palaces.duplicateLabel', { name: palace.name })}
                  onClick={() => onDuplicate(palace.id)}
                >
                  <Copy className="size-4" aria-hidden />
                </IconButton>
                <IconButton
                  size="sm"
                  variant="danger"
                  aria-label={t('palaces.deleteLabel', { name: palace.name })}
                  onClick={() => onDelete(palace.id)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </IconButton>
              </div>
            </div>
          )}
        </motion.li>
      ))}
    </ul>
  )
}

function PalaceSummary({
  palace,
  onOpen,
  openLabel,
}: {
  palace: Palace
  onOpen?: (id: string) => void
  openLabel: string
}) {
  const content = (
    <>
      <h3 className="truncate">{palace.name}</h3>
      {palace.description ? (
        <p className="truncate text-[length:var(--p-text-label)]">{palace.description}</p>
      ) : null}
    </>
  )

  if (!onOpen) {
    return <div className="min-w-0 flex-1 px-1">{content}</div>
  }
  return (
    <button
      type="button"
      aria-label={openLabel}
      onClick={() => onOpen(palace.id)}
      className="min-w-0 flex-1 rounded-control px-1 py-1 text-left transition-transform duration-150 ease-out active:scale-[0.99]"
    >
      {content}
    </button>
  )
}
