import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Locus, LocusChanges } from '@/entities/locus'
import { cn } from '@/shared/lib'
import { Button, cardSurface, IconButton, TextField } from '@/shared/ui'

export interface LociListProps {
  loci: Locus[]
  onEdit: (id: string, changes: LocusChanges) => void
  onDelete: (id: string) => void
}

/** Presentational list of loci with inline front/back editing. The page owns the
 * create form and wires the commands. */
export function LociList({ loci, onEdit, onDelete }: LociListProps) {
  const { t } = useTranslation()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')

  if (loci.length === 0) {
    return (
      <p className="rounded-card bg-card-glass p-6 text-center shadow-rest">{t('loci.empty')}</p>
    )
  }

  const startEdit = (locus: Locus) => {
    setEditingId(locus.id)
    setFront(locus.front)
    setBack(locus.back)
  }

  const commitEdit = (id: string) => {
    const nextFront = front.trim()
    const nextBack = back.trim()
    if (nextFront && nextBack) onEdit(id, { front: nextFront, back: nextBack })
    setEditingId(null)
  }

  return (
    <ul className="flex flex-col gap-3">
      {loci.map((locus) => (
        <motion.li
          key={locus.id}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(cardSurface, 'px-3 py-2.5')}
        >
          {editingId === locus.id ? (
            <div className="flex flex-col gap-2">
              <TextField
                aria-label={t('loci.frontLabel')}
                value={front}
                onChange={(event) => setFront(event.target.value)}
                autoFocus
              />
              <TextField
                aria-label={t('loci.backLabel')}
                value={back}
                onChange={(event) => setBack(event.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => commitEdit(locus.id)}>
                  {t('loci.save')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  {t('loci.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <div className="min-w-0 flex-1 px-1">
                <h3 className="truncate">{locus.front}</h3>
                <p className="truncate text-[length:var(--p-text-label)]">{locus.back}</p>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-0.5">
                <IconButton
                  size="sm"
                  aria-label={t('loci.editLabel', { front: locus.front })}
                  onClick={() => startEdit(locus)}
                >
                  <Pencil className="size-4" aria-hidden />
                </IconButton>
                <IconButton
                  size="sm"
                  variant="danger"
                  aria-label={t('loci.deleteLabel', { front: locus.front })}
                  onClick={() => onDelete(locus.id)}
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
