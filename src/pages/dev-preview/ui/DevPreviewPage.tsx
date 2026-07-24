import { type ReactNode, useEffect, useRef, useState } from 'react'
import {
  ArrowUpDown,
  Bell,
  Clock,
  Copy,
  Flame,
  Mail,
  Pencil,
  Star,
  Trash2,
  Type,
} from 'lucide-react'
import { DECK_COLOR_OPTIONS } from '@/entities/deck'
import { FolderForm } from '@/widgets/folder-form'
import { cn } from '@/shared/lib'
import {
  ActionSheet,
  AppScreen,
  AuthField,
  Avatar,
  Badge,
  Button,
  Chip,
  Combobox,
  ConfirmDialog,
  DeckCover,
  EditableTitle,
  Empty,
  FlyoutMenu,
  FolderGlyph,
  GlassCard,
  GradeButtons,
  IconButton,
  IconColorRow,
  Input,
  PasswordField,
  Progress,
  PromptSheet,
  SegmentedControl,
  SelectDot,
  Sheet,
  SortControl,
  SrsStatusChip,
  StatTile,
  SwipeRow,
  Switch,
  Textarea,
} from '@/shared/ui'

/**
 * Dev-only component gallery (`/dev/kitchen-sink`, registered in `app/router.tsx` only under
 * `import.meta.env.DEV`, so it tree-shakes out of production). It renders the `shared/ui`
 * surfaces in their real states — including the ones that are invisible on desktop and in
 * jsdom (clipped rings, keyboard lift, focus theft, truncation, dark mode) — so styling
 * regressions are catchable in one place. See `docs/CODE_STYLE.md` §11; open the sheet cases
 * on a real device, since keyboard behaviour only exists there.
 */

const FIRST_COLOR = DECK_COLOR_OPTIONS[0]?.value ?? ''
const MID_COLOR = DECK_COLOR_OPTIONS[Math.floor(DECK_COLOR_OPTIONS.length / 2)]?.value ?? ''
const LAST_COLOR = DECK_COLOR_OPTIONS[DECK_COLOR_OPTIONS.length - 1]?.value ?? ''

const LONG_TEXT = 'Neuroanatomy — cranial nerves, brainstem nuclei & their clinical syndromes'

const BUTTON_VARIANTS = ['default', 'secondary', 'ghost', 'destructive'] as const
const BUTTON_SIZES = ['sm', 'md', 'lg'] as const
const ICON_BUTTON_VARIANTS = ['ghost', 'tint', 'solid', 'glass', 'danger'] as const
const BADGE_VARIANTS = ['default', 'info', 'outline'] as const
const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const
type ThemeMode = (typeof THEME_OPTIONS)[number]['value']

const SECTIONS = [
  { id: 'overlays', label: 'Overlays' },
  { id: 'colour', label: 'Colour row' },
  { id: 'gestures', label: 'Swipe' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'inputs', label: 'Inputs' },
  { id: 'toggles', label: 'Toggles' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'data', label: 'Data' },
] as const

// ── Layout helpers ────────────────────────────────────────────────────────────

function Section({
  id,
  title,
  note,
  children,
}: {
  id: string
  title: string
  note?: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-4">
      <div className="mb-3">
        <h2 className="text-[length:var(--p-text-sub)] font-semibold text-heading">{title}</h2>
        {note ? (
          <p className="mt-0.5 text-[length:var(--p-text-label)] text-muted-foreground">{note}</p>
        ) : null}
      </div>
      <div className="rounded-card-featured border border-border bg-card p-4">{children}</div>
    </section>
  )
}

function Cases({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-start gap-x-6 gap-y-5">{children}</div>
}

/** One labelled example cell — the state name reads as a caption beneath the sample. */
function Case({ label, full, children }: { label: string; full?: boolean; children: ReactNode }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', full && 'w-full')}>
      <div className="min-w-0">{children}</div>
      <span className="text-[length:var(--p-text-label)] text-muted-foreground">{label}</span>
    </div>
  )
}

// ── Interactive demos (self-contained so the page component stays a layout) ─────

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

/** Mirrors the fixed `FolderSheet`: focus via `initialFocus` (never native autofocus) so the
 *  footer lifts above the keyboard and tapping a colour keeps the field focused. */
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

function SwipeDemo() {
  return (
    <SwipeRow
      leading={[
        {
          id: 'star',
          icon: <Star className="size-5" aria-hidden />,
          label: 'Star',
          accent: 'teal',
          onAction: () => {},
        },
      ]}
      trailing={[
        {
          id: 'delete',
          icon: <Trash2 className="size-5" aria-hidden />,
          label: 'Delete',
          accent: 'rose',
          onAction: () => {},
        },
      ]}
    >
      <div className="flex items-center gap-3 rounded-card border border-border bg-card px-4 py-3">
        <span className="text-[length:var(--p-text-body)] text-heading">
          Swipe me left or right
        </span>
      </div>
    </SwipeRow>
  )
}

function SegmentedDemo() {
  const [value, setValue] = useState<'flashcards' | 'quiz' | 'match'>('flashcards')
  return (
    <SegmentedControl
      aria-label="Study mode"
      value={value}
      onChange={setValue}
      options={[
        { value: 'flashcards', label: 'Cards' },
        { value: 'quiz', label: 'Quiz' },
        { value: 'match', label: 'Match' },
      ]}
    />
  )
}

function ComboboxDemo() {
  const [value, setValue] = useState<'bible' | 'notes' | 'csv'>('notes')
  return (
    <Combobox
      label="Import format"
      value={value}
      onChange={setValue}
      options={[
        { value: 'notes', label: 'Notes' },
        { value: 'bible', label: 'Bible' },
        { value: 'csv', label: 'CSV' },
      ]}
    />
  )
}

function AuthFieldsDemo() {
  const [email, setEmail] = useState('ada@example.com')
  const [broken, setBroken] = useState('not-an-email')
  const [password, setPassword] = useState('hunter2')
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <AuthField
        id="demo-email"
        label="Email"
        value={email}
        onValueChange={setEmail}
        icon={<Mail />}
        valid
      />
      <AuthField
        id="demo-email-error"
        label="Email"
        value={broken}
        onValueChange={setBroken}
        icon={<Mail />}
        error="Enter a valid email address"
      />
      <PasswordField
        id="demo-password"
        label="Password"
        value={password}
        onValueChange={setPassword}
      />
    </div>
  )
}

function EditableTitleDemo({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial)
  return <EditableTitle value={value} onRename={setValue} editLabel="Rename" />
}

// ── Page ────────────────────────────────────────────────────────────────────

export function DevPreviewPage() {
  const [theme, setTheme] = useState<ThemeMode>('system')
  const [scrollNode, setScrollNode] = useState<HTMLElement | null>(null)
  const [activeId, setActiveId] = useState<string>(SECTIONS[0]?.id ?? '')
  const [progress] = useState(62)
  const [toggle, setToggle] = useState(true)
  const [selected, setSelected] = useState(true)

  // Preview theme: drive `data-theme` directly, restoring the app's real theme on exit.
  const originalTheme = useRef<string | undefined>(undefined)
  useEffect(() => {
    originalTheme.current = document.documentElement.dataset.theme
    return () => {
      if (originalTheme.current) document.documentElement.dataset.theme = originalTheme.current
    }
  }, [])
  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      root.dataset.theme = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  // Scroll-spy: highlight the nav chip for the section nearest the top of the scroll area.
  useEffect(() => {
    if (!scrollNode) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActiveId(entry.target.id)
      },
      { root: scrollNode, rootMargin: '0px 0px -70% 0px', threshold: 0 },
    )
    for (const section of SECTIONS) {
      const element = document.getElementById(section.id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [scrollNode])

  const jumpTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <AppScreen
      scrollRef={setScrollNode}
      header={
        <header className="border-b border-border bg-card/80 backdrop-blur-md">
          <div className="mx-auto w-full max-w-[430px] px-5 pt-safe">
            <div className="flex items-start justify-between gap-3 pt-3">
              <div className="flex min-w-0 flex-col">
                <span className="text-[length:var(--p-text-title)] font-bold text-heading">
                  Kitchen sink
                </span>
                <span className="text-[length:var(--p-text-label)] text-muted-foreground">
                  Component states — dev only · CODE_STYLE.md §11
                </span>
              </div>
              <SegmentedControl
                aria-label="Preview theme"
                size="sm"
                value={theme}
                onChange={setTheme}
                options={THEME_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                className="w-[180px] shrink-0"
              />
            </div>
            <nav
              aria-label="Sections"
              className="-mx-1.5 mt-3 flex gap-2 overflow-x-auto p-1.5 scrollbar-hide"
            >
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => jumpTo(section.id)}
                  aria-current={activeId === section.id}
                  className={cn(
                    'shrink-0 rounded-full px-3 py-1.5 text-[length:var(--p-text-label)] font-medium transition-colors',
                    activeId === section.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-info-surface text-info-foreground',
                  )}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </div>
        </header>
      }
    >
      <div className="flex flex-col gap-8 pt-4 pb-32">
        <Section
          id="overlays"
          title="Overlays & sheets"
          note="Open on a phone: footers ride above the keyboard, tapping a colour keeps focus, the handle drags only the sheet."
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

        <Section
          id="colour"
          title="Colour row — ring clipping"
          note="The selected swatch's ring must show in full on the first and last colours (overflow-x-auto clips both axes)."
        >
          <div className="flex flex-col gap-5">
            <Case label="first selected" full>
              <ColorRowDemo initialColor={FIRST_COLOR} />
            </Case>
            <Case label="middle selected" full>
              <ColorRowDemo initialColor={MID_COLOR} />
            </Case>
            <Case label="last selected" full>
              <ColorRowDemo initialColor={LAST_COLOR} />
            </Case>
          </div>
        </Section>

        <Section
          id="gestures"
          title="Swipe row"
          note="touch-action trap: the row swipes without the page scrolling; actions reveal behind an opaque row."
        >
          <SwipeDemo />
        </Section>

        <Section id="buttons" title="Buttons & actions" note="Every variant × size, plus disabled.">
          <div className="flex flex-col gap-5">
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
            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
              {ICON_BUTTON_VARIANTS.map((variant) => (
                <IconButton key={variant} variant={variant} aria-label={`Icon button ${variant}`}>
                  <Bell className="size-5" aria-hidden />
                </IconButton>
              ))}
            </div>
            <div className="border-t border-border pt-4">
              <GradeButtons onGrade={() => {}} />
            </div>
          </div>
        </Section>

        <Section
          id="inputs"
          title="Inputs & fields"
          note="Default, disabled, error, and long values — check placeholder contrast and truncation."
        >
          <div className="flex flex-col gap-5">
            <Cases>
              <Case label="input" full>
                <Input defaultValue="Cranial nerves" aria-label="Sample input" />
              </Case>
              <Case label="placeholder" full>
                <Input placeholder="Deck name" aria-label="Placeholder input" />
              </Case>
              <Case label="disabled" full>
                <Input defaultValue="Locked" disabled aria-label="Disabled input" />
              </Case>
              <Case label="textarea" full>
                <Textarea defaultValue={LONG_TEXT} rows={3} aria-label="Sample textarea" />
              </Case>
            </Cases>
            <div className="border-t border-border pt-4">
              <ComboboxDemo />
            </div>
            <div className="border-t border-border pt-4">
              <AuthFieldsDemo />
            </div>
          </div>
        </Section>

        <Section id="toggles" title="Selection & toggles">
          <div className="flex flex-col gap-5">
            <Case label="SegmentedControl" full>
              <SegmentedDemo />
            </Case>
            <Cases>
              <Case label="switch on">
                <Switch checked={toggle} onCheckedChange={setToggle} label="Notifications" />
              </Case>
              <Case label="switch disabled">
                <Switch checked={false} onCheckedChange={() => {}} disabled label="Disabled" />
              </Case>
              <Case label="select dot">
                <button
                  type="button"
                  onClick={() => setSelected((value) => !value)}
                  aria-pressed={selected}
                >
                  <SelectDot selected={selected} />
                </button>
              </Case>
            </Cases>
            <Cases>
              <Case label="chip">
                <Chip icon={<Flame className="size-3.5" aria-hidden />}>12 due</Chip>
              </Case>
              {BADGE_VARIANTS.map((variant) => (
                <Case key={variant} label={`badge · ${variant}`}>
                  <Badge variant={variant}>{variant}</Badge>
                </Case>
              ))}
              <Case label="SRS status">
                <SrsStatusChip />
              </Case>
            </Cases>
          </div>
        </Section>

        <Section id="feedback" title="Feedback & status">
          <div className="flex flex-col gap-5">
            <Cases>
              <Case label="progress 0" full>
                <Progress value={0} />
              </Case>
              <Case label={`progress ${progress}`} full>
                <Progress value={progress} />
              </Case>
              <Case label="progress 100" full>
                <Progress value={100} />
              </Case>
            </Cases>
            <div className="border-t border-border pt-4">
              <Empty
                emoji="🗂️"
                title="No decks yet"
                description="Create your first deck to start studying."
                action={<Button size="sm">New deck</Button>}
              />
            </div>
          </div>
        </Section>

        <Section id="data" title="Data display">
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              <StatTile
                icon={<Flame className="size-5" aria-hidden />}
                value="14"
                label="Day streak"
              />
              <StatTile
                icon={<Clock className="size-5" aria-hidden />}
                value="2h 40m"
                label="Studied"
              />
            </div>
            <Cases>
              <Case label="deck cover">
                <DeckCover icon="📗" color={FIRST_COLOR} className="size-16 rounded-card" />
              </Case>
              <Case label="folder glyph">
                <FolderGlyph icon="📁" color={MID_COLOR} className="size-16" />
              </Case>
              <Case label="avatar">
                <Avatar name="Ada Lovelace" className="size-12" />
              </Case>
              <Case label="glass card">
                <GlassCard className="grid size-16 place-items-center rounded-card">
                  <ArrowUpDown className="size-5 text-heading" aria-hidden />
                </GlassCard>
              </Case>
            </Cases>
            <div className="flex flex-col gap-4 border-t border-border pt-4">
              <Case label="editable title" full>
                <EditableTitleDemo initial="Biology 101" />
              </Case>
              <Case label="editable title — long (truncation)" full>
                <EditableTitleDemo initial={LONG_TEXT} />
              </Case>
            </div>
          </div>
        </Section>
      </div>
    </AppScreen>
  )
}
