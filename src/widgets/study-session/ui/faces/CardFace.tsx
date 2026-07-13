import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Flag, Lightbulb, MapPin, SlidersHorizontal, Volume2 } from 'lucide-react'
import type { StudyMode } from '@/entities/preferences'
import { cn } from '@/shared/lib'
import { STUDY_MODE_META } from '../mode-meta'
import { stopPress } from './types'

/**
 * The frame every face shares: a pinned header, a pinned footer, and the one scrollable
 * region on the card between them. Nothing rendered as a child may declare its own
 * `overflow` — a nested scroller would both steal the drag and, when this body reports that
 * it fits, sit under a `touch-action: none` ancestor that cannot pan.
 */
export function CardFace({
  flagged,
  canSpeak,
  speakText,
  onSpeak,
  active,
  mode,
  onChangeMode,
  onOpenGear,
  back = false,
  align = 'center',
  footer,
  children,
}: {
  flagged: boolean
  canSpeak: boolean
  speakText: string
  onSpeak: (text: string) => void
  active: boolean
  mode: StudyMode
  onChangeMode: () => void
  onOpenGear: () => void
  back?: boolean
  align?: 'center' | 'start'
  footer?: ReactNode
  children: ReactNode
}) {
  const { t } = useTranslation()
  const bodyRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scrolls, setScrolls] = useState(false)

  useLayoutEffect(() => {
    const body = bodyRef.current
    const content = contentRef.current
    if (!body || !content) return
    const measure = () => setScrolls(body.scrollHeight > body.clientHeight + 1)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(body)
    observer.observe(content)
    return () => observer.disconnect()
  }, [children])

  useEffect(() => {
    if (active) return
    const el = bodyRef.current
    if (el && el.contains(document.activeElement)) {
      ;(document.activeElement as HTMLElement).blur()
    }
  }, [active])

  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col rounded-card-featured bg-card-glass shadow-elevated backface-hidden',
        back && 'transform-[rotateY(180deg)]',
      )}
      inert={!active}
    >
      <header className="flex h-9 shrink-0 touch-none items-center justify-end gap-1.5 px-4 pt-2.5">
        {flagged ? <Flag className="size-4 fill-rating text-(--rating-edge)" aria-hidden /> : null}
        {canSpeak ? (
          <button
            type="button"
            onPointerDown={stopPress}
            onClick={() => onSpeak(speakText)}
            aria-label={t('study.readAloud')}
            className="grid size-7 place-items-center rounded-control bg-info-surface text-heading transition-transform active:scale-90"
          >
            <Volume2 className="size-3.5" aria-hidden />
          </button>
        ) : null}
      </header>

      <div
        ref={bodyRef}
        data-card-scroll={scrolls ? '' : undefined}
        style={{ touchAction: scrolls ? 'pan-y' : 'none' }}
        className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain scrollbar-hide px-5"
      >
        {/* Auto margins centre short content but, unlike `justify-center`, never push tall
            content past the top edge where it could not be scrolled back to. */}
        <div
          ref={contentRef}
          className={cn(
            'flex w-full shrink-0 flex-col gap-3',
            align === 'center' ? 'my-auto' : 'mb-auto pt-1',
          )}
        >
          {children}
        </div>
      </div>

      <footer className="flex min-h-13 shrink-0 touch-none items-center justify-between gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1.5">
        <ModeButton mode={mode} onClick={onChangeMode} />
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2">
          {footer}
        </div>
        <GearButton onClick={onOpenGear} />
      </footer>
    </div>
  )
}

export function AidButton({
  label,
  onClick,
  tone = 'solid',
}: {
  label: string
  onClick: () => void
  tone?: 'solid' | 'quiet'
}) {
  return (
    <button
      type="button"
      onPointerDown={stopPress}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-11 items-center rounded-control px-4 text-(length:--p-text-label) font-semibold transition-transform active:scale-[0.97]',
        tone === 'solid'
          ? 'bg-info-surface text-heading'
          : 'text-muted-foreground active:bg-info-surface',
      )}
    >
      {label}
    </button>
  )
}

function ModeButton({ mode, onClick }: { mode: StudyMode; onClick: () => void }) {
  const { t } = useTranslation()
  const Icon = STUDY_MODE_META[mode].Icon
  return (
    <button
      type="button"
      aria-label={t('study.changeMode')}
      onPointerDown={stopPress}
      onClick={onClick}
      className="grid size-11 shrink-0 place-items-center rounded-control bg-info-surface text-heading transition-transform active:scale-[0.97]"
    >
      <Icon className="size-4.5" aria-hidden />
    </button>
  )
}

function GearButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      aria-label={t('study.options')}
      onPointerDown={stopPress}
      onClick={onClick}
      className="grid size-11 shrink-0 place-items-center rounded-control bg-info-surface text-heading transition-transform active:scale-[0.97]"
    >
      <SlidersHorizontal className="size-4.5" aria-hidden />
    </button>
  )
}

export function TipRow({ tip }: { tip: string }) {
  const { t } = useTranslation()
  const [peek, setPeek] = useState(false)
  return (
    <div className="flex min-h-8 shrink-0 items-center justify-center">
      {peek ? (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[36ch] text-pretty text-(length:--p-text-label) italic text-muted-foreground"
        >
          {tip}
        </motion.p>
      ) : (
        <button
          type="button"
          onPointerDown={stopPress}
          onClick={() => setPeek(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-(--warning-surface) px-3 py-1.5 text-(length:--p-text-label) font-semibold text-(--warning-foreground)"
        >
          <Lightbulb className="size-3.5" aria-hidden />
          {t('study.peekHint')}
        </button>
      )}
    </div>
  )
}

export function HintCard({ hint }: { hint: string }) {
  const { t } = useTranslation()
  return (
    <div className="w-full rounded-card bg-secondary/20 p-4 text-left">
      <div className="mb-1.5 flex items-center gap-2">
        <MapPin className="size-4 shrink-0 text-heading" aria-hidden />
        <p className="text-(length:--p-text-label) font-semibold text-heading">
          {t('study.whereToPicture')}
        </p>
      </div>
      <p className="text-(length:--p-text-label) italic leading-relaxed text-muted-foreground">
        {hint}
      </p>
    </div>
  )
}

export function FlipZone({
  label,
  onFlip,
  className,
  children,
}: {
  label: string
  onFlip: () => void
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      data-flip
      aria-label={label}
      onPointerDown={stopPress}
      onClick={onFlip}
      className={cn('block w-full', className)}
    >
      {children}
    </button>
  )
}

export function BackPrompt({ prompt, onFlip }: { prompt: string; onFlip: () => void }) {
  const { t } = useTranslation()
  return (
    <>
      <FlipZone label={t('study.showFront')} onFlip={onFlip} className="shrink-0">
        <span className="block truncate text-center text-(length:--p-text-label) font-semibold text-accent">
          {prompt}
        </span>
      </FlipZone>
      <div className="mx-auto h-px w-24 shrink-0 bg-border" aria-hidden />
    </>
  )
}
