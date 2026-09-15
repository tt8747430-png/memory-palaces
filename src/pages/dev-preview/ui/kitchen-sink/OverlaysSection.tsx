import { useRef, useState } from 'react'
import { Clock, Copy, Flame, Pencil, Star, Trash2, Type } from 'lucide-react'
import { AppearanceFields } from '@/widgets/appearance-form'
import {
  ActionSheet,
  Button,
  ConfirmDialog,
  FlyoutMenu,
  PromptSheet,
  Sheet,
  SortControl,
} from '@/shared/ui'
import { Section, Cases, Case } from './layout'
import { FIRST_COLOR } from './fixtures'

function PromptSheetDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Prompt sheet
      </Button>
      <PromptSheet
        open={open}
        onOpenChange={setOpen}
        title="New deck"
        fieldLabel="Deck name"
        placeholder="Deck name"
        initialValue="New Deck"
        confirmLabel="Create"
        onSubmit={() => {}}
      />
    </>
  )
}

function FolderSheetDemo() {
  const [open, setOpen] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('New Folder')
  const [color, setColor] = useState(FIRST_COLOR)
  const [icon, setIcon] = useState('📁')
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Folder sheet
      </Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="New folder"
        initialFocus={nameRef}
        footer={
          <Button size="lg" className="w-full" onClick={() => setOpen(false)}>
            Create folder
          </Button>
        }
      >
        <form
          className="pb-2"
          onSubmit={(event) => {
            event.preventDefault()
            setOpen(false)
          }}
        >
          <AppearanceFields
            subject="folder"
            name={name}
            color={color}
            icon={icon}
            onNameChange={setName}
            onColorChange={setColor}
            onIconChange={setIcon}
            nameRef={nameRef}
            autoFocusName
          />
        </form>
      </Sheet>
    </>
  )
}

function ActionSheetDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Action sheet
      </Button>
      <ActionSheet
        open={open}
        onOpenChange={setOpen}
        title="Deck actions"
        cancelLabel="Cancel"
        actions={[
          {
            id: 'rename',
            label: 'Rename',
            icon: <Pencil className="size-5" aria-hidden />,
            onSelect: () => {},
          },
          {
            id: 'duplicate',
            label: 'Duplicate',
            icon: <Copy className="size-5" aria-hidden />,
            onSelect: () => {},
          },
          {
            id: 'delete',
            label: 'Delete',
            icon: <Trash2 className="size-5" aria-hidden />,
            destructive: true,
            onSelect: () => {},
          },
        ]}
      />
    </>
  )
}

function ConfirmDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Confirm dialog
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete deck?"
        description="This removes the deck and all of its cards. This can't be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {}}
      />
    </>
  )
}

function FlyoutDemo() {
  return (
    <FlyoutMenu
      label="More"
      variant="tint"
      actions={[
        {
          id: 'edit',
          label: 'Edit',
          icon: <Pencil className="size-5" aria-hidden />,
          onSelect: () => {},
        },
        {
          id: 'star',
          label: 'Favourite',
          icon: <Star className="size-5" aria-hidden />,
          onSelect: () => {},
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: <Trash2 className="size-5" aria-hidden />,
          destructive: true,
          onSelect: () => {},
        },
      ]}
    />
  )
}

function SortDemo() {
  const [value, setValue] = useState<'recent' | 'name' | 'due'>('recent')
  return (
    <SortControl
      label="Sort"
      value={value}
      onChange={setValue}
      options={[
        { value: 'recent', label: 'Recent', icon: <Clock className="size-4" aria-hidden /> },
        { value: 'name', label: 'Name', icon: <Type className="size-4" aria-hidden /> },
        { value: 'due', label: 'Due', icon: <Flame className="size-4" aria-hidden /> },
      ]}
    />
  )
}

export function OverlaysSection() {
  return (
    <Section
      id="overlays"
      title="Overlays & sheets"
      note="Open on a phone: a sheet's footer rides above the keyboard (a page footer does not), tapping a colour keeps focus, the handle drags only the sheet."
    >
      <Cases>
        <Case label="PromptSheet">
          <PromptSheetDemo />
        </Case>
        <Case label="Sheet + form">
          <FolderSheetDemo />
        </Case>
        <Case label="ActionSheet">
          <ActionSheetDemo />
        </Case>
        <Case label="ConfirmDialog">
          <ConfirmDemo />
        </Case>
        <Case label="FlyoutMenu">
          <FlyoutDemo />
        </Case>
        <Case label="SortControl">
          <SortDemo />
        </Case>
      </Cases>
    </Section>
  )
}
