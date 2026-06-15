import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import type { Locus, LocusChanges } from '@/entities/locus'
import { Button } from '@/shared/ui'

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
      <p className="rounded-card bg-card-glass p-5 text-center shadow-rest">{t('loci.empty')}</p>
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
          className="rounded-card bg-card-glass p-4 shadow-rest"
        >
          {editingId === locus.id ? (
            <div className="flex flex-col gap-2">
              <input
                aria-label={t('loci.frontLabel')}
                value={front}
                onChange={(event) => setFront(event.target.value)}
                autoFocus
                className="h-11 rounded-control border border-border bg-card px-3 text-heading"
              />
              <input
                aria-label={t('loci.backLabel')}
                value={back}
                onChange={(event) => setBack(event.target.value)}
                className="h-11 rounded-control border border-border bg-card px-3 text-heading"
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
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-heading">{locus.front}</h3>
                <p className="truncate text-sm text-muted-foreground">{locus.back}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={t('loci.editLabel', { front: locus.front })}
                  onClick={() => startEdit(locus)}
                >
                  {t('loci.edit')}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  aria-label={t('loci.deleteLabel', { front: locus.front })}
                  onClick={() => onDelete(locus.id)}
                >
                  {t('loci.delete')}
                </Button>
              </div>
            </div>
          )}
        </motion.li>
      ))}
    </ul>
  )
}
