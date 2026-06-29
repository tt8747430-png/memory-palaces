import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check, ChevronDown, Plus } from 'lucide-react'
import { selectLoci, useLocusStore, useLocusStoreApi } from '@/entities/locus'
import { selectRooms, useRoomStore, useRoomStoreApi } from '@/entities/room'
import { createLocus, editLocus } from '@/features/locus'
import { cn } from '@/shared/lib'
import { AppScreen, Button, FlyoutMenu, ScreenHeader } from '@/shared/ui'
import { type CardData, CardFields } from '@/widgets/loci-editor'

export interface CardEditorPageProps {
  roomId: string
  /** Present in edit mode; omit to create. */
  cardId?: string
  onBack: () => void
  /** Return to the room after a save commits. */
  onDone: () => void
}

/** Full-screen create/edit for a flashcard — the required front/back pair plus the optional
 * place and peek cues. The save action lives top-right in the header: creating shows a split
 * button whose default is "Save & add another" (so a deck is built without leaving the
 * screen), with "Save & close" one tap away in its menu; editing saves and returns.
 * `createLocus`/`editLocus` are the shared write commands the Tutor reuses. */
export function CardEditorPage({ roomId, cardId, onBack, onDone }: CardEditorPageProps) {
  const { t } = useTranslation()
  const locusStore = useLocusStoreApi()
  const roomStore = useRoomStoreApi()
  const loci = useLocusStore(selectLoci)
  const rooms = useRoomStore(selectRooms)

  useEffect(() => {
    locusStore.getState().start()
    roomStore.getState().start()
  }, [locusStore, roomStore])

  const editing = cardId ? (loci.find((l) => l.id === cardId) ?? null) : null
  const room = rooms.find((r) => r.id === roomId)

  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [hint, setHint] = useState('')
  const [tip, setTip] = useState('')
  const frontRef = useRef<HTMLInputElement>(null)

  // Seed from the card once it resolves from the store (edit mode); a create starts blank.
  useEffect(() => {
    setFront(editing?.front ?? '')
    setBack(editing?.back ?? '')
    setHint(editing?.hint ?? '')
    setTip(editing?.tip ?? '')
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
    toast.success(t('loci.editor.addedNext'))
    clear()
  }
  // Create — save the current card and return to the room.
  const saveAndClose = async () => {
    if (!valid) return
    await createLocus(locusStore, roomId, build())
    toast.success(t('loci.editor.added'))
    onDone()
  }
  // Edit — persist the changes and return.
  const saveEdit = async () => {
    if (!valid || !editing) return
    await editLocus(locusStore, editing.id, build())
    toast.success(t('loci.editor.updated'))
    onDone()
  }

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
              <Button
                size="md"
                className="shrink-0"
                disabled={!valid}
                aria-label={t('common.saveChanges')}
                onClick={() => void saveEdit()}
              >
                <Check className="size-[18px]" aria-hidden />
                {t('loci.editor.save')}
              </Button>
            ) : (
              <SaveSplit
                valid={valid}
                onAdd={() => void saveAndAdd()}
                onClose={() => void saveAndClose()}
              />
            )
          }
        />
      }
    >
      <div className="mt-4 pb-10">
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

/** The create-mode save control: a split button pinned top-right. Its wide segment fires the
 * default "Save & add another"; the caret opens a menu with that plus "Save & close". Per-
 * segment rounding (not a clipped container) keeps the global focus ring visible. Disabled
 * until the card has both a front and a back. */
function SaveSplit({
  valid,
  onAdd,
  onClose,
}: {
  valid: boolean
  onAdd: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        'flex h-11 shrink-0 items-stretch rounded-control shadow-interactive transition-opacity',
        !valid && 'opacity-50',
      )}
    >
      <button
        type="button"
        disabled={!valid}
        onClick={onAdd}
        aria-label={t('loci.editor.saveAndAdd')}
        className="flex items-center gap-1.5 rounded-l-control bg-primary pl-3.5 pr-2.5 text-[length:var(--p-text-sub)] font-semibold text-primary-foreground transition-[filter] active:brightness-95 disabled:pointer-events-none"
      >
        <Plus className="size-[18px]" aria-hidden />
        {t('loci.editor.save')}
      </button>
      <span className="w-px bg-primary-foreground/25" aria-hidden />
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
            className="grid w-11 place-items-center rounded-r-control bg-primary text-primary-foreground transition-[filter] active:brightness-95 disabled:pointer-events-none"
          >
            <ChevronDown className="size-4" aria-hidden />
          </button>
        }
      />
    </div>
  )
}
