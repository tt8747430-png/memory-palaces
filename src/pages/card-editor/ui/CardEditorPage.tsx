import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check, Plus } from 'lucide-react'
import { selectLoci, useLocusStore, useLocusStoreApi } from '@/entities/locus'
import { selectRooms, useRoomStore, useRoomStoreApi } from '@/entities/room'
import { createLocus, editLocus } from '@/features/locus'
import { AppScreen, Button, ScreenHeader } from '@/shared/ui'
import { type CardData, CardFields } from '@/widgets/loci-editor'

export interface CardEditorPageProps {
  roomId: string
  /** Present in edit mode; omit to create. */
  cardId?: string
  onBack: () => void
  /** Return to the room after a save commits. */
  onDone: () => void
}

/** Full-screen create/edit for a flashcard — front/back plus the optional place cue and peek
 * hint. The primary path for adding cards (the in-editor sheet stays only as a standalone
 * fallback). Creating offers "Save & add another" to keep a deck-building flow moving. */
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

  const saveAndAdd = async () => {
    if (!valid) return
    await createLocus(locusStore, roomId, build())
    toast.success(t('loci.editor.addedNext'))
    clear()
  }

  const submit = async () => {
    if (!valid) return
    if (editing) {
      await editLocus(locusStore, editing.id, build())
      toast.success(t('loci.editor.updated'))
    } else {
      await createLocus(locusStore, roomId, build())
      toast.success(t('loci.editor.added'))
    }
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
        />
      }
    >
      <div className="mt-4 pb-40">
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

      <div className="sticky inset-x-0 bottom-0 z-20 -mx-4 flex flex-col gap-2.5 border-t border-border/60 bg-card/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        {!editing ? (
          <Button variant="ghost" size="lg" disabled={!valid} onClick={() => void saveAndAdd()}>
            <Plus className="size-[18px]" aria-hidden />
            {t('loci.editor.saveAndAdd')}
          </Button>
        ) : null}
        <Button size="lg" disabled={!valid} onClick={() => void submit()}>
          <Check className="size-[18px]" aria-hidden />
          {editing ? t('common.saveChanges') : t('loci.editor.save')}
        </Button>
      </div>
    </AppScreen>
  )
}
