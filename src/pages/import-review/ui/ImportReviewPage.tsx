import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Download, Pencil, Trash2 } from 'lucide-react'
import { useCardStoreApi } from '@/entities/card'
import { useQuestionStoreApi } from '@/entities/question'
import { applyDeckContent } from '@/features/content'
import type { ParsedCard } from '@/shared/lib'
import {
  AppScreen,
  Button,
  ConfirmDialog,
  IconButton,
  OverflowMenuButton,
  ScreenHeader,
  Sheet,
  Switch,
} from '@/shared/ui'
import { CardFields, type DraftCard, useImportDraft } from '@/widgets/content-editor'

export interface ImportReviewPageProps {
  deckId: string
  onBack: () => void
  /** Import committed (or draft abandoned) — return to the room. */
  onDone: () => void
}

interface RestoreOptions {
  cues: boolean
  flags: boolean
  known: boolean
  schedule: boolean
}

/**
 * The shared review step for every import (paste / Mindscape / Anki). Shows the parsed cards,
 * lets the user edit or delete them (or clear the lot), and — for a Mindscape backup — toggle
 * which restorable fields to keep. "Import cards" writes them into the room. Fed by the
 * ephemeral `importDraft` store; a deep-link with no pending draft bounces back to the room.
 */
export function ImportReviewPage({ deckId, onBack, onDone }: ImportReviewPageProps) {
  const { t } = useTranslation()
  const draft = useImportDraft((s) => s.draft)
  const editCard = useImportDraft((s) => s.editCard)
  const removeCard = useImportDraft((s) => s.removeCard)
  const clear = useImportDraft((s) => s.clear)

  const cardStore = useCardStoreApi()
  const questionStore = useQuestionStoreApi()

  // The review always arrives from the room (store already warm), but starting is idempotent
  // and guarantees appended order reads correctly even on a deep link.
  useEffect(() => {
    cardStore.getState().start()
  }, [cardStore])

  const [restore, setRestore] = useState<RestoreOptions>({
    cues: true,
    flags: true,
    known: true,
    schedule: true,
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [clearOpen, setClearOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  // Nothing to review (fresh load / deep link, or the draft was cleared) — leave.
  useEffect(() => {
    if (!draft) onDone()
  }, [draft, onDone])

  const cards = draft?.cards ?? []
  const isMindscape = draft?.source === 'mindscape'
  const editing = useMemo(
    () => draft?.cards.find((c) => c.id === editingId) ?? null,
    [draft, editingId],
  )

  const toApplied = (card: DraftCard): ParsedCard => {
    const keepCues = !isMindscape || restore.cues
    return {
      front: card.front,
      back: card.back,
      ...(keepCues && card.hint ? { hint: card.hint } : {}),
      ...(keepCues && card.tip ? { tip: card.tip } : {}),
      ...(isMindscape && restore.flags && card.flagged ? { flagged: true } : {}),
      ...(isMindscape && restore.known && card.memorized ? { memorized: true } : {}),
      ...(isMindscape && restore.schedule && card.srs ? { srs: card.srs } : {}),
    }
  }

  const doImport = async () => {
    if (busy || cards.length === 0) return
    setBusy(true)
    const applied = cards.map(toApplied)
    await applyDeckContent(cardStore, questionStore, deckId, { cards: applied, questions: [] })
    toast.success(t('cards.review.done', { count: applied.length }))
    clear()
    onDone()
  }

  if (!draft) return null

  return (
    <AppScreen
      fill
      header={
        <ScreenHeader
          title={t('cards.review.title')}
          onBack={onBack}
          backLabel={t('common.back')}
        />
      }
      footer={
        <div className="bg-glass shrink-0 border-t border-white/40 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_30px_oklch(var(--p-tint-navy)/0.1)]">
          <Button
            size="lg"
            className="w-full"
            disabled={cards.length === 0 || busy}
            onClick={() => void doImport()}
          >
            <Download className="size-[18px]" aria-hidden />
            {t('cards.review.importCards', { count: cards.length })}
          </Button>
        </div>
      }
    >
      <div className="mt-4 flex flex-col gap-5 pb-6">
        {isMindscape ? (
          <section>
            <h2 className="mb-2 text-[length:var(--p-text-label)] font-bold uppercase tracking-wide text-muted-foreground">
              {t('cards.review.restoreLabel')}
            </h2>
            <div className="overflow-hidden rounded-card border border-border bg-card shadow-rest">
              <RestoreToggle
                label={t('cards.review.restoreCues')}
                checked={restore.cues}
                onChange={(v) => setRestore((r) => ({ ...r, cues: v }))}
              />
              <RestoreToggle
                label={t('cards.review.restoreFlags')}
                checked={restore.flags}
                onChange={(v) => setRestore((r) => ({ ...r, flags: v }))}
              />
              <RestoreToggle
                label={t('cards.review.restoreKnown')}
                checked={restore.known}
                onChange={(v) => setRestore((r) => ({ ...r, known: v }))}
              />
              <RestoreToggle
                label={t('cards.review.restoreSchedule')}
                checked={restore.schedule}
                onChange={(v) => setRestore((r) => ({ ...r, schedule: v }))}
                last
              />
            </div>
          </section>
        ) : null}

        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-[length:var(--p-text-sub)] font-bold text-heading">
              {t('cards.review.generated', { count: cards.length })}
            </h2>
            {cards.length > 0 ? (
              <IconButton
                variant="ghost"
                size="sm"
                aria-label={t('cards.review.clearAll')}
                onClick={() => setClearOpen(true)}
                className="text-[var(--danger-on-surface)]"
              >
                <Trash2 className="size-4" aria-hidden />
              </IconButton>
            ) : null}
          </div>

          {cards.length === 0 ? (
            <div className="rounded-card bg-card-glass p-6 text-center shadow-rest">
              <p className="text-[length:var(--p-text-body)] text-muted-foreground">
                {t('cards.review.empty')}
              </p>
              <button
                type="button"
                onClick={onDone}
                className="mt-2 text-[length:var(--p-text-label)] font-semibold text-accent"
              >
                {t('cards.review.emptyBack')}
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {cards.map((card) => (
                <li key={card.id}>
                  <ReviewRow
                    card={card}
                    onEdit={() => setEditingId(card.id)}
                    onDelete={() => removeCard(card.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <EditCardSheet
        card={editing}
        onSave={(id, edit) => editCard(id, edit)}
        onClose={() => setEditingId(null)}
      />

      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        destructive
        icon={<Trash2 className="size-6" aria-hidden />}
        title={t('cards.review.clearTitle')}
        description={t('cards.review.clearBody')}
        confirmLabel={t('cards.review.clearConfirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          clear()
          onDone()
        }}
      />
    </AppScreen>
  )
}

function RestoreToggle({
  label,
  checked,
  onChange,
  last = false,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  last?: boolean
}) {
  return (
    <label
      className={`flex items-center justify-between gap-3 px-4 py-3 ${last ? '' : 'border-b border-border'}`}
    >
      <span className="text-[length:var(--p-text-body)] font-medium text-heading">{label}</span>
      <Switch label={label} checked={checked} onCheckedChange={onChange} />
    </label>
  )
}

/** A compact draft-card row: front + back preview, with an overflow menu to edit or delete. */
function ReviewRow({
  card,
  onEdit,
  onDelete,
}: {
  card: DraftCard
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2 rounded-card border border-border bg-card p-4 shadow-rest">
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <p className="truncate text-[length:var(--p-text-sub)] font-semibold text-heading">
          {card.front}
        </p>
        <p className="mt-0.5 truncate text-[length:var(--p-text-label)] text-muted-foreground">
          {card.back}
        </p>
      </button>
      <OverflowMenuButton
        variant="tint"
        size="sm"
        label={t('cards.row.menuLabel')}
        actions={[
          {
            id: 'edit',
            label: t('common.edit'),
            icon: <Pencil className="size-5" aria-hidden />,
            onSelect: onEdit,
          },
          {
            id: 'delete',
            label: t('common.delete'),
            icon: <Trash2 className="size-5" aria-hidden />,
            destructive: true,
            onSelect: onDelete,
          },
        ]}
      />
    </div>
  )
}

function EditCardSheet({
  card,
  onSave,
  onClose,
}: {
  card: DraftCard | null
  onSave: (id: string, edit: { front: string; back: string; hint?: string; tip?: string }) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [hint, setHint] = useState('')
  const [tip, setTip] = useState('')

  useEffect(() => {
    if (card) {
      setFront(card.front)
      setBack(card.back)
      setHint(card.hint ?? '')
      setTip(card.tip ?? '')
    }
    // Seed only when the target card changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id])

  const valid = front.trim().length > 0 && back.trim().length > 0
  const save = () => {
    if (!card || !valid) return
    onSave(card.id, {
      front: front.trim(),
      back: back.trim(),
      hint: hint.trim() || undefined,
      tip: tip.trim() || undefined,
    })
    onClose()
  }

  return (
    <Sheet
      open={card !== null}
      onOpenChange={(open) => !open && onClose()}
      title={t('cards.review.editTitle')}
      footer={
        <Button size="lg" className="w-full" disabled={!valid} onClick={save}>
          {t('common.saveChanges')}
        </Button>
      }
    >
      <CardFields
        front={front}
        back={back}
        hint={hint}
        tip={tip}
        onFront={setFront}
        onBack={setBack}
        onHint={setHint}
        onTip={setTip}
      />
    </Sheet>
  )
}
