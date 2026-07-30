import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { selectCards, useCardStore, useCardStoreApi } from '@/entities/card'
import { selectDecks, useDeckStore } from '@/entities/deck'
import { createCard, editCard } from '@/features/card'
import { cardsInSubtree, cn, findEntity } from '@/shared/lib'
import { AppScreen, FooterBar, ScreenHeader } from '@/shared/ui'
import { CardFields, useCardDraft } from '@/widgets/content-editor'

export interface CardEditorPageProps {
  deckId: string
  cardId?: string
  onBack: () => void
  onNavigateCard?: (cardId: string) => void
}

export function CardEditorPage({ deckId, cardId, onBack, onNavigateCard }: CardEditorPageProps) {
  const { t } = useTranslation()
  const cardStore = useCardStoreApi()
  const allCards = useCardStore(selectCards)
  const decks = useDeckStore(selectDecks)

  const editing = findEntity(allCards, cardId) ?? null
  const deck = findEntity(decks, deckId)

  const deckCards = useMemo(
    () => cardsInSubtree(decks, allCards, deckId),
    [decks, allCards, deckId],
  )
  const position = editing ? deckCards.findIndex((c) => c.id === editing.id) : -1
  const prevCard = position > 0 ? deckCards[position - 1] : undefined
  const nextCard =
    position >= 0 && position < deckCards.length - 1 ? deckCards[position + 1] : undefined

  const draft = useCardDraft(editing, editing?.id ?? deckId)
  const frontRef = useRef<HTMLInputElement>(null)

  const [justSaved, setJustSaved] = useState(false)
  const savedTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(savedTimer.current), [])
  const flashSaved = () => {
    setJustSaved(true)
    window.clearTimeout(savedTimer.current)
    savedTimer.current = window.setTimeout(() => setJustSaved(false), 1500)
  }

  useEffect(() => setJustSaved(false), [editing?.id])

  const saveAndAdd = async () => {
    if (!draft.valid) return
    await createCard(cardStore, deckId, draft.changes)
    flashSaved()
    toast.success(t('cards.editor.addedNext'))
    draft.clear()
    frontRef.current?.focus()
  }
  const saveEdit = async () => {
    if (!draft.valid || !editing) return
    await editCard(cardStore, editing.id, draft.changes)
    flashSaved()
  }
  const goToCard = async (target?: { id: string }) => {
    if (!target || !onNavigateCard) return
    if (editing && draft.valid && draft.dirty) await editCard(cardStore, editing.id, draft.changes)
    onNavigateCard(target.id)
  }

  const showNav = Boolean(editing && onNavigateCard && deckCards.length > 1)

  return (
    <AppScreen
      fill
      header={
        <ScreenHeader
          title={editing ? t('cards.editor.editTitle') : t('cards.editor.newTitle')}
          subtitle={deck?.name}
          onBack={onBack}
          backLabel={t('common.back')}
          action={
            <SaveButton
              adding={!editing}
              saved={justSaved}
              disabled={!draft.valid}
              onClick={() => void (editing ? saveEdit() : saveAndAdd())}
            />
          }
        />
      }
      footer={
        showNav ? (
          <DeckNav
            position={position}
            total={deckCards.length}
            prevLabel={t('cards.editor.prevCard')}
            nextLabel={t('cards.editor.nextCard')}
            hasPrev={Boolean(prevCard)}
            hasNext={Boolean(nextCard)}
            onPrev={() => void goToCard(prevCard)}
            onNext={() => void goToCard(nextCard)}
          />
        ) : undefined
      }
    >
      <div className="mt-4 pb-8">
        <CardFields
          front={draft.front}
          back={draft.back}
          hint={draft.hint}
          tip={draft.tip}
          onFront={draft.setFront}
          onBack={draft.setBack}
          onHint={draft.setHint}
          onTip={draft.setTip}
          frontRef={frontRef}
        />
      </div>
    </AppScreen>
  )
}

function SaveButton({
  adding,
  saved,
  disabled,
  onClick,
}: {
  adding: boolean
  saved: boolean
  disabled: boolean
  onClick: () => void
}) {
  const { t } = useTranslation()
  const IdleIcon = adding ? Plus : Check
  const idleLabel = adding ? t('cards.editor.saveAndAdd') : t('common.saveChanges')
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={saved ? t('cards.editor.saved') : idleLabel}
      className={cn(
        'flex h-11 shrink-0 items-center gap-1.5 rounded-control px-5 text-[length:var(--p-text-sub)] font-semibold text-primary-foreground shadow-interactive',
        'transition-[background-color,transform] duration-200 ease-out active:scale-[0.97]',
        'disabled:pointer-events-none disabled:opacity-50',
        saved ? 'bg-success' : 'bg-primary',
      )}
    >
      {saved ? (
        <Check className="size-[18px]" aria-hidden />
      ) : (
        <IdleIcon className="size-[18px]" aria-hidden />
      )}
      {saved ? t('cards.editor.saved') : t('cards.editor.save')}
    </button>
  )
}

function DeckNav({
  position,
  total,
  prevLabel,
  nextLabel,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: {
  position: number
  total: number
  prevLabel: string
  nextLabel: string
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
}) {
  const progress = total > 0 ? ((position + 1) / total) * 100 : 0
  return (
    <FooterBar role="navigation" aria-label={prevLabel}>
      <div className="flex items-center justify-between gap-2">
        <DeckNavButton side="prev" label={prevLabel} disabled={!hasPrev} onClick={onPrev} />
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[length:var(--p-text-sub)] font-bold tabular-nums text-heading">
            {position + 1}
            <span className="font-semibold text-muted-foreground"> / {total}</span>
          </span>
          <span className="block h-1 w-16 overflow-hidden rounded-full bg-border" aria-hidden>
            <span
              className="block h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </span>
        </div>
        <DeckNavButton side="next" label={nextLabel} disabled={!hasNext} onClick={onNext} />
      </div>
    </FooterBar>
  )
}

function DeckNavButton({
  side,
  label,
  disabled,
  onClick,
}: {
  side: 'prev' | 'next'
  label: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-11 items-center gap-1 rounded-control bg-secondary px-3.5 text-[length:var(--p-text-sub)] font-semibold text-secondary-foreground',
        'transition-transform duration-200 ease-out active:scale-95',
        'disabled:pointer-events-none disabled:bg-transparent disabled:text-muted-foreground disabled:opacity-50',
      )}
    >
      {side === 'prev' ? <ChevronLeft className="size-5" aria-hidden /> : null}
      {label}
      {side === 'next' ? <ChevronRight className="size-5" aria-hidden /> : null}
    </button>
  )
}
