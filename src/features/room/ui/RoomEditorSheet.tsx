import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DoorOpen } from 'lucide-react'
import type { Room, RoomStore } from '@/entities/room'
import { Button, Sheet, Textarea, TextField } from '@/shared/ui'
import { createRoom } from '../create-room'
import { editRoom } from '../edit-room'

/** `add` opens a blank sheet for a palace; `edit` seeds the sheet from a room. */
export type RoomEditorTarget = { mode: 'add'; palaceId: string } | { mode: 'edit'; room: Room }

export interface RoomEditorSheetProps {
  store: RoomStore
  /** The room being edited / the palace to add into, or null when closed. */
  target: RoomEditorTarget | null
  onOpenChange: (open: boolean) => void
  /** Called with the created/edited room after it persists (e.g. to toast). */
  onSaved?: (room: Room) => void
}

/**
 * Add or edit a room. Adding asks for just a name — the description is added later from room
 * settings (edit mode), keeping the add step to one decision. Editing shows both fields.
 * A keyboard-aware bottom sheet, mirroring `CreatePalaceSheet`; the create/edit commands are
 * the shared write-path so the Tutor can reuse them.
 */
export function RoomEditorSheet({ store, target, onOpenChange, onSaved }: RoomEditorSheetProps) {
  const { t } = useTranslation()
  const open = target !== null
  const editing = target?.mode === 'edit' ? target.room : null

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Re-seed each time a target opens; the sheet itself stays mounted.
  useEffect(() => {
    if (!open) return
    setTitle(editing?.title ?? '')
    setDescription(editing?.description ?? '')
    setSubmitting(false)
  }, [open, editing?.id, editing?.title, editing?.description])

  const valid = title.trim().length > 0

  const handleSave = async () => {
    if (!valid || submitting || !target) return
    setSubmitting(true)
    try {
      const changes = { title: title.trim(), description: description.trim() }
      const room =
        target.mode === 'edit'
          ? await editRoom(store, target.room.id, changes)
          : await createRoom(store, target.palaceId, changes)
      onOpenChange(false)
      onSaved?.(room)
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? t('rooms.editor.editTitle') : t('rooms.editor.addTitle')}
      description={t('rooms.editor.subtitle')}
      footer={
        <Button
          size="lg"
          className="w-full"
          disabled={!valid || submitting}
          onClick={() => void handleSave()}
        >
          <DoorOpen className="size-[18px]" aria-hidden />
          {editing ? t('rooms.editor.save') : t('rooms.editor.add')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <label className="block">
          <span className="mb-1.5 block text-[length:var(--p-text-label)] font-semibold text-heading">
            {t('rooms.editor.nameLabel')}
          </span>
          <TextField
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void handleSave()
            }}
            placeholder={t('rooms.editor.namePlaceholder')}
            autoFocus
            enterKeyHint="done"
            maxLength={80}
          />
        </label>
        {editing ? (
          <label className="block">
            <span className="mb-1.5 block text-[length:var(--p-text-label)] font-semibold text-heading">
              {t('rooms.editor.descriptionLabel')}
            </span>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t('rooms.editor.descriptionPlaceholder')}
              rows={3}
              maxLength={160}
            />
          </label>
        ) : null}
      </div>
    </Sheet>
  )
}
