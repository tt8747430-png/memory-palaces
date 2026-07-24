import { type ReactNode, useRef, useState } from 'react'
import { DECK_COLOR_OPTIONS } from '@/entities/deck'
import { FolderForm } from '@/widgets/folder-form'
import {
  ActionSheet,
  AppScreen,
  Button,
  IconColorRow,
  PromptSheet,
  SegmentedControl,
  Sheet,
  Switch,
} from '@/shared/ui'

/**
 * Dev-only component gallery (`/dev/kitchen-sink`, registered in `app/router.tsx` only under
 * `import.meta.env.DEV`, so it tree-shakes out of production). It renders the trap-prone
 * `shared/ui` surfaces in their edge states so the styling bugs that are invisible on desktop
 * and in jsdom (clipped rings, keyboard lift, focus theft) are visible in one place. See
 * `docs/CODE_STYLE.md` §11 for what each block is checking, and eyeball the sheet cases on a
 * real device — the keyboard behaviour only exists there.
 */

const FIRST_COLOR = DECK_COLOR_OPTIONS[0]?.value ?? ''
const LAST_COLOR = DECK_COLOR_OPTIONS[DECK_COLOR_OPTIONS.length - 1]?.value ?? ''

const BUTTON_VARIANTS = ['default', 'secondary', 'ghost', 'destructive'] as const
const BUTTON_SIZES = ['sm', 'md', 'lg'] as const

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-[length:var(--p-text-sub)] font-semibold text-heading">{title}</h2>
      {note ? (
        <p className="mt-1 mb-3 text-[length:var(--p-text-label)] text-muted-foreground">{note}</p>
      ) : (
        <div className="mb-3" />
      )}
      <div className="rounded-card-featured border border-border bg-card p-4">{children}</div>
    </section>
  )
}

/** Independent state per row so the first / middle / last swatch can each be the selected one. */
function ColorRowDemo({ initialColor }: { initialColor: string }) {
  const [color, setColor] = useState(initialColor)
  const [icon, setIcon] = useState('📁')
  return (
    <IconColorRow
      icon={icon}
      color={color}
      onIconChange={setIcon}
      onColorChange={setColor}
      colorOptions={DECK_COLOR_OPTIONS}
      label="Colour"
      iconLabel="Icon"
    />
  )
}

/** Mirrors the fixed `FolderSheet` flow: focus via `initialFocus` (not native autofocus), so the
 *  sheet lifts above the keyboard and tapping a colour keeps the field focused. */
function FolderSheetDemo() {
  const [open, setOpen] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('New Folder')
  const [color, setColor] = useState(FIRST_COLOR)
  const [icon, setIcon] = useState('📁')
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open folder sheet
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
          <FolderForm
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

export function DevPreviewPage() {
  const [promptOpen, setPromptOpen] = useState(false)
  const [actionOpen, setActionOpen] = useState(false)
  const [segment, setSegment] = useState<'first' | 'second' | 'third'>('first')
  const [toggle, setToggle] = useState(true)

  return (
    <AppScreen
      header={
        <header className="mx-auto w-full max-w-[430px] px-5 pt-safe">
          <div className="flex flex-col pt-3 pb-3">
            <span className="text-[length:var(--p-text-title)] font-bold text-heading">
              Kitchen sink
            </span>
            <span className="text-[length:var(--p-text-label)] text-muted-foreground">
              Dev-only component states — see docs/CODE_STYLE.md §11
            </span>
          </div>
        </header>
      }
    >
      <div className="pt-2 pb-32">
        <Section
          title="Colour row — ring clipping"
          note="The selected swatch's ring must show fully, including on the first and last colours (overflow-x-auto clips both axes)."
        >
          <div className="flex flex-col gap-5">
            <ColorRowDemo initialColor={FIRST_COLOR} />
            <ColorRowDemo initialColor={LAST_COLOR} />
            <ColorRowDemo initialColor={FIRST_COLOR} />
          </div>
        </Section>

        <Section
          title="Sheets — keyboard, focus & drag (test on device)"
          note="Open on a phone: the footer should ride above the keyboard, tapping a colour keeps the keyboard up, and the drag handle drags only the sheet."
        >
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setPromptOpen(true)}>
              Open prompt sheet
            </Button>
            <FolderSheetDemo />
            <Button variant="secondary" onClick={() => setActionOpen(true)}>
              Open action sheet
            </Button>
          </div>
        </Section>

        <Section title="Buttons" note="Every variant × size, plus the disabled state.">
          <div className="flex flex-col gap-4">
            {BUTTON_VARIANTS.map((variant) => (
              <div key={variant} className="flex flex-wrap items-center gap-3">
                {BUTTON_SIZES.map((size) => (
                  <Button key={size} variant={variant} size={size}>
                    {variant} · {size}
                  </Button>
                ))}
                <Button variant={variant} disabled>
                  disabled
                </Button>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Segmented control & switch">
          <div className="flex flex-col gap-4">
            <SegmentedControl
              aria-label="Demo segmented control"
              value={segment}
              onChange={setSegment}
              options={[
                { value: 'first', label: 'First' },
                { value: 'second', label: 'Second' },
                { value: 'third', label: 'Third' },
              ]}
            />
            <Switch checked={toggle} onCheckedChange={setToggle} label="Toggle" />
          </div>
        </Section>
      </div>

      <PromptSheet
        open={promptOpen}
        onOpenChange={setPromptOpen}
        title="New deck"
        fieldLabel="Deck name"
        placeholder="Deck name"
        initialValue="New Deck"
        confirmLabel="Create"
        onSubmit={() => {}}
      />
      <ActionSheet
        open={actionOpen}
        onOpenChange={setActionOpen}
        title="Actions"
        cancelLabel="Cancel"
        actions={[
          { id: 'edit', label: 'Edit', onSelect: () => {} },
          { id: 'delete', label: 'Delete', destructive: true, onSelect: () => {} },
        ]}
      />
    </AppScreen>
  )
}
