import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { cardsForDeck, selectCards, useCardStore, useCardStoreApi } from '@/entities/card'
import { selectDecks, useDeckStore, useDeckStoreApi } from '@/entities/deck'
import { createCard, editCard } from '@/features/card'
import { cn } from '@/shared/lib'
import { AppScreen, ScreenHeader } from '@/shared/ui'
import { type CardData, CardFields } from '@/widgets/content-editor'

export interface CardEditorPageProps {
  deckId: string
  /** Present in edit mode; omit to create. */
  cardId?: string
  onBack: () => void
  /** Edit mode: jump to another card in the deck (prev/next) without leaving the editor. The
   * route navigates with replace, so browsing cards never stacks the back history. */
  onNavigateCard?: (cardId: string) => void
}

/** Full-screen create/edit for a flashcard — the required front/back pair plus the optional
 * place and peek cues. Creating always saves-and-adds-another (one primary button); the deck
 * grows without leaving the screen, and Back returns to the deck. Editing saves *in place*
 * (the button confirms with "Saved" and you stay), with a pinned prev/next footer to walk the
 * deck's own cards — moving auto-saves a valid change so edits are never lost. `createCard`/
 * `editCard` are the shared write commands the Tutor reuses. */
export function CardEditorPage({ deckId, cardId, onBack, onNavigateCard }: CardEditorPageProps) {
  const { t } = useTranslation()
  const cardStore = useCardStoreApi()
  const deckStore = useDeckStoreApi()
  const allCards = useCardStore(selectCards)
  const decks = useDeckStore(selectDecks)

  useEffect(() => {
    cardStore.getState().start()
    deckStore.getState().start()
  }, [cardStore, deckStore])

  const editing = cardId ? (allCards.find((c) => c.id === cardId) ?? null) : null
  const deck = decks.find((d) => d.id === deckId)

  // The deck's own cards in order — drives the prev/next position.
  const deckCards = useMemo(() => cardsForDeck(allCards, deckId), [allCards, deckId])
  const position = editing ? deckCards.findIndex((c) => c.id === editing.id) : -1
  const prevCard = position > 0 ? deckCards[position - 1] : undefined
  const nextCard =
    position >= 0 && position < deckCards.length - 1 ? deckCards[position + 1] : undefined

  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [hint, setHint] = useState('')
  const [tip, setTip] = useState('')
  const frontRef = useRef<HTMLInputElement>(null)

  const [justSaved, setJustSaved] = useState(false)
  const savedTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(savedTimer.current), [])
  const flashSaved = () => {
    setJustSaved(true)
    window.clearTimeout(savedTimer.current)
    savedTimer.current = window.setTimeout(() => setJustSaved(false), 1500)
  }

  useEffect(() => {
    setFront(editing?.front ?? '')
    setBack(editing?.back ?? '')
    setHint(editing?.hint ?? '')
    setTip(editing?.tip ?? '')
    setJustSaved(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.id])

  const valid = front.trim().length > 0 && back.trim().length > 0
  const build = (): CardData => ({
    front: front.trim(),
    back: back.trim(),
    ...(hint.trim() ? { hint: hint.trim() } : {}),
    ...(tip.trim() ? { tip: tip.trim() } : {}),
  })
  const dirty = editing
    ? front.trim() !== editing.front ||
      back.trim() !== editing.back ||
      hint.trim() !== (editing.hint ?? '') ||
      tip.trim() !== (editing.tip ?? '')
    : false

  const clear = () => {
    setFront('')
    setBack('')
    setHint('')
    setTip('')
    frontRef.current?.focus()
  }

  const saveAndAdd = async () => {
    if (!valid) return
    await createCard(cardStore, deckId, build())
    flashSaved()
    toast.success(t('loci.editor.addedNext'))
    clear()
  }
  const saveEdit = async () => {
    if (!valid || !editing) return
    await editCard(cardStore, editing.id, build())
    flashSaved()
  }
  const goToCard = async (target?: { id: string }) => {
    if (!target || !onNavigateCard) return
    if (editing && valid && dirty) await editCard(cardStore, editing.id, build())
    onNavigateCard(target.id)
  }

  const showNav = Boolean(editing && onNavigateCard && deckCards.length > 1)

  return (
    <AppScreen
      fill
      header={
        <ScreenHeader
          title={editing ? t('loci.editor.editTitle') : t('loci.editor.newTitle')}
          subtitle={deck?.name}
          onBack={onBack}
          backLabel={t('common.back')}
          action={
            <SaveButton
              adding={!editing}
              saved={justSaved}
              disabled={!valid}
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
            prevLabel={t('loci.editor.prevCard')}
            nextLabel={t('loci.editor.nextCard')}
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
          front={front}
          back={back}
          hint={hint}
          tip={tip}
          onFront={setFront}
          onBack={setBack}
          onHint={setHint}
          onTip={setTip}
          frontRef={frontRef}
        />
      </div>
    </AppScreen>
  )
}

/** The header save button — one shape for both modes. A primary pill that flips green and
 * reads "Saved" for a beat after a write. */
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
  const idleLabel = adding ? t('loci.editor.saveAndAdd') : t('common.saveChanges')
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={saved ? t('loci.editor.saved') : idleLabel}
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
      {saved ? t('loci.editor.saved') : t('loci.editor.save')}
    </button>
  )
}

/** The pinned edit-mode footer: walk the deck's own cards without leaving the editor. */
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
    <nav
      className="bg-glass shrink-0 border-t border-white/40 px-4 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_oklch(var(--p-tint-navy)/0.1)]"
      aria-label={prevLabel}
    >
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
    </nav>
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
