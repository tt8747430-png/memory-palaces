import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check, ChevronDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { lociForRoom, selectLoci, useLocusStore, useLocusStoreApi } from '@/entities/locus'
import { selectRooms, useRoomStore, useRoomStoreApi } from '@/entities/room'
import { createLocus, editLocus } from '@/features/locus'
import { cn } from '@/shared/lib'
import { AppScreen, FlyoutMenu, ScreenHeader } from '@/shared/ui'
import { type CardData, CardFields } from '@/widgets/loci-editor'

export interface CardEditorPageProps {
  roomId: string
  /** Present in edit mode; omit to create. */
  cardId?: string
  onBack: () => void
  /** Leave for the room after a save commits (create "save & close"); navigates with replace
   * so the editor never lingers in history. */
  onDone: () => void
  /** Edit mode: jump to another card in the room (prev/next) without leaving the editor. The
   * route navigates with replace, so browsing cards never stacks the back history. */
  onNavigateCard?: (cardId: string) => void
}

/** Full-screen create/edit for a flashcard — the required front/back pair plus the optional
 * place and peek cues. Creating shows a split "Save & add another" (default) / "Save & close"
 * button top-right. Editing saves *in place* (the button confirms with "Saved" and you stay),
 * with a prev/next footer to walk the deck — moving auto-saves a valid change so edits are
 * never lost. `createLocus`/`editLocus` are the shared write commands the Tutor reuses. */
export function CardEditorPage({
  roomId,
  cardId,
  onBack,
  onDone,
  onNavigateCard,
}: CardEditorPageProps) {
  const { t } = useTranslation()
  const locusStore = useLocusStoreApi()
  const roomStore = useRoomStoreApi()
  const allLoci = useLocusStore(selectLoci)
  const rooms = useRoomStore(selectRooms)

  useEffect(() => {
    locusStore.getState().start()
    roomStore.getState().start()
  }, [locusStore, roomStore])

  const editing = cardId ? (allLoci.find((l) => l.id === cardId) ?? null) : null
  const room = rooms.find((r) => r.id === roomId)

  // The room's deck in route order — drives the prev/next position.
  const roomCards = useMemo(() => lociForRoom(allLoci, roomId), [allLoci, roomId])
  const position = editing ? roomCards.findIndex((c) => c.id === editing.id) : -1
  const prevCard = position > 0 ? roomCards[position - 1] : undefined
  const nextCard =
    position >= 0 && position < roomCards.length - 1 ? roomCards[position + 1] : undefined

  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [hint, setHint] = useState('')
  const [tip, setTip] = useState('')
  const frontRef = useRef<HTMLInputElement>(null)

  // A brief "Saved" confirmation on the save button after a successful in-place save.
  const [justSaved, setJustSaved] = useState(false)
  const savedTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(savedTimer.current), [])
  const flashSaved = () => {
    setJustSaved(true)
    window.clearTimeout(savedTimer.current)
    savedTimer.current = window.setTimeout(() => setJustSaved(false), 1500)
  }

  // Seed from the card; clears the saved flash when the target changes (prev/next).
  useEffect(() => {
    setFront(editing?.front ?? '')
    setBack(editing?.back ?? '')
    setHint(editing?.hint ?? '')
    setTip(editing?.tip ?? '')
    setJustSaved(false)
    // Seed only when the target card changes — not on every field, or the form would reset
    // mid-edit each time the store re-emits.
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

  // Create — the header's default action: save, confirm, then reset to a blank card with the
  // front refocused, so building a deck never leaves this screen.
  const saveAndAdd = async () => {
    if (!valid) return
    await createLocus(locusStore, roomId, build())
    flashSaved()
    toast.success(t('loci.editor.addedNext'))
    clear()
  }
  // Create — save the current card and return to the room.
  const saveAndClose = async () => {
    if (!valid) return
    await createLocus(locusStore, roomId, build())
    onDone()
  }
  // Edit — persist in place and confirm on the button; the user stays to keep editing or browse.
  const saveEdit = async () => {
    if (!valid || !editing) return
    await editLocus(locusStore, editing.id, build())
    flashSaved()
  }
  // Prev/next — persist a valid change to the current card before swapping, so edits survive
  // moving between cards.
  const goToCard = async (target?: { id: string }) => {
    if (!target || !onNavigateCard) return
    if (editing && valid && dirty) await editLocus(locusStore, editing.id, build())
    onNavigateCard(target.id)
  }

  const showNav = Boolean(editing && onNavigateCard && roomCards.length > 1)

  return (
    <AppScreen
      fill
      header={
        <ScreenHeader
          title={editing ? t('loci.editor.editTitle') : t('loci.editor.newTitle')}
          subtitle={room?.title}
          onBack={onBack}
          backLabel={t('roomHub.back')}
          action={
            editing ? (
              <SaveButton saved={justSaved} disabled={!valid} onClick={() => void saveEdit()} />
            ) : (
              <SaveSplit
                saved={justSaved}
                valid={valid}
                onAdd={() => void saveAndAdd()}
                onClose={() => void saveAndClose()}
              />
            )
          }
        />
      }
    >
      <div className={cn('mt-4', showNav ? 'pb-24' : 'pb-10')}>
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

      {showNav ? (
        <div className="sticky inset-x-0 bottom-0 z-20 -mx-5 flex items-center justify-between gap-3 border-t border-border/60 bg-card/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
          <NavButton
            side="prev"
            label={t('loci.editor.prevCard')}
            disabled={!prevCard}
            onClick={() => void goToCard(prevCard)}
          />
          <span className="text-[length:var(--p-text-label)] font-semibold tabular-nums text-muted-foreground">
            {position + 1} / {roomCards.length}
          </span>
          <NavButton
            side="next"
            label={t('loci.editor.nextCard')}
            disabled={!nextCard}
            onClick={() => void goToCard(nextCard)}
          />
        </div>
      ) : null}
    </AppScreen>
  )
}

/** The edit-mode save button: a primary pill that turns green and reads "Saved" for a beat
 * after a save, then settles back — the confirmation the user asked for, in place. */
function SaveButton({
  saved,
  disabled,
  onClick,
}: {
  saved: boolean
  disabled: boolean
  onClick: () => void
}) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={saved ? t('loci.editor.saved') : t('common.saveChanges')}
      className={cn(
        'flex h-11 shrink-0 items-center gap-1.5 rounded-control px-5 text-[length:var(--p-text-sub)] font-semibold text-primary-foreground shadow-interactive',
        'transition-[background-color,transform] duration-200 ease-out active:scale-[0.97]',
        'disabled:pointer-events-none disabled:opacity-50',
        saved ? 'bg-success' : 'bg-primary',
      )}
    >
      <Check className="size-[18px]" aria-hidden />
      {saved ? t('loci.editor.saved') : t('loci.editor.save')}
    </button>
  )
}

/** The create-mode split button: the wide segment fires the default "Save & add another"; the
 * caret opens a menu with that plus "Save & close". Flashes green + "Saved" after a save.
 * Per-segment rounding keeps the global focus ring visible. */
function SaveSplit({
  saved,
  valid,
  onAdd,
  onClose,
}: {
  saved: boolean
  valid: boolean
  onAdd: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const tone = saved ? 'bg-success' : 'bg-primary'
  return (
    <div
      className={cn(
        'flex h-11 shrink-0 items-stretch rounded-control shadow-interactive transition-opacity',
        !valid && !saved && 'opacity-50',
      )}
    >
      <button
        type="button"
        disabled={!valid}
        onClick={onAdd}
        aria-label={saved ? t('loci.editor.saved') : t('loci.editor.saveAndAdd')}
        className={cn(
          'flex items-center gap-1.5 rounded-l-control pl-3.5 pr-2.5 text-[length:var(--p-text-sub)] font-semibold text-primary-foreground transition-[filter,background-color] active:brightness-95 disabled:pointer-events-none',
          tone,
        )}
      >
        {saved ? <Check className="size-[18px]" aria-hidden /> : <Plus className="size-[18px]" aria-hidden />}
        {saved ? t('loci.editor.saved') : t('loci.editor.save')}
      </button>
      <span className={cn('w-px', saved ? 'bg-white/25' : 'bg-primary-foreground/25')} aria-hidden />
      <FlyoutMenu
        label={t('loci.editor.saveOptions')}
        side="bottom"
        align="end"
        actions={[
          {
            id: 'add',
            label: t('loci.editor.saveAndAdd'),
            icon: <Plus className="size-5" aria-hidden />,
            onSelect: onAdd,
          },
          {
            id: 'close',
            label: t('loci.editor.saveAndClose'),
            icon: <Check className="size-5" aria-hidden />,
            onSelect: onClose,
          },
        ]}
        trigger={
          <button
            type="button"
            disabled={!valid}
            aria-label={t('loci.editor.saveOptions')}
            className={cn(
              'grid w-11 place-items-center rounded-r-control text-primary-foreground transition-[filter,background-color] active:brightness-95 disabled:pointer-events-none',
              tone,
            )}
          >
            <ChevronDown className="size-4" aria-hidden />
          </button>
        }
      />
    </div>
  )
}

function NavButton({
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
      className="flex items-center gap-1 rounded-control px-2 py-2 text-[length:var(--p-text-sub)] font-semibold text-heading transition-transform active:scale-95 disabled:pointer-events-none disabled:opacity-30"
    >
      {side === 'prev' ? <ChevronLeft className="size-5" aria-hidden /> : null}
      {label}
      {side === 'next' ? <ChevronRight className="size-5" aria-hidden /> : null}
    </button>
  )
}
