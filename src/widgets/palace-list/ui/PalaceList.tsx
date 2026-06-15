import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import type { Palace } from '@/entities/palace'
import { Button } from '@/shared/ui'

export interface PalaceListProps {
  palaces: Palace[]
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

/** Presentational list of palaces. Reads nothing from the store — the page passes
 * data and wires the commands — so it stays reusable and easy to test. */
export function PalaceList({ palaces, onRename, onDelete, onDuplicate }: PalaceListProps) {
  const { t } = useTranslation()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  if (palaces.length === 0) {
    return (
      <p className="rounded-card bg-card-glass p-5 text-center shadow-rest">{t('palaces.empty')}</p>
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
          className="rounded-card bg-card-glass p-4 shadow-rest"
        >
          {editingId === palace.id ? (
            <div className="flex gap-2">
              <input
                aria-label={t('palaces.renameLabel', { name: palace.name })}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && commitEdit(palace.id)}
                autoFocus
                className="h-11 flex-1 rounded-control border border-border bg-card px-3 text-heading"
              />
              <Button size="sm" onClick={() => commitEdit(palace.id)}>
                {t('palaces.save')}
              </Button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-heading">{palace.name}</h3>
                {palace.description ? (
                  <p className="truncate text-sm text-muted-foreground">{palace.description}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={t('palaces.renameLabel', { name: palace.name })}
                  onClick={() => startEdit(palace)}
                >
                  {t('palaces.rename')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={t('palaces.duplicateLabel', { name: palace.name })}
                  onClick={() => onDuplicate(palace.id)}
                >
                  {t('palaces.duplicate')}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  aria-label={t('palaces.deleteLabel', { name: palace.name })}
                  onClick={() => onDelete(palace.id)}
                >
                  {t('palaces.delete')}
                </Button>
              </div>
            </div>
          )}
        </motion.li>
      ))}
    </ul>
  )
}
