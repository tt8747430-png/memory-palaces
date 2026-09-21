import type { CSSProperties, ReactNode } from 'react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Flag, FlipHorizontal2, Lightbulb, MapPin, SlidersHorizontal, Volume2 } from 'lucide-react'
import type { StudyMode } from '@/entities/preferences'
import {
  CARD_STYLE_SURFACE,
  CARD_STYLE_TEXT,
  cn,
  resolveCardStyle,
  useColorScheme,
  SCREEN_SCROLL,
  useKeyboardReveal,
} from '@/shared/lib'
import { pillSurface } from '@/shared/ui'
import { STUDY_MODE_META } from '../mode-meta'
import { type FaceProps, stopPress } from './types'

export interface CardFaceProps {
  face: FaceProps
  speakText: string
  back?: boolean
  align?: 'center' | 'start'
  footer?: ReactNode
  children: ReactNode
}

export function CardFace({
  face,
  speakText,
  back = false,
  align = 'center',
  footer,
  children,
}: CardFaceProps) {
  const { card, cardStyle, canSpeak, onSpeak, active, mode, onChangeMode, onOpenGear } = face
  const flagged = card.card.flagged
  const scheme = useColorScheme()
  const { t } = useTranslation()
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scrolls, setScrolls] = useState(false)
  const revealScroll = useKeyboardReveal()

  const setBody = useCallback(
    (node: HTMLDivElement | null) => {
      bodyRef.current = node
      revealScroll(node)
    },
    [revealScroll],
  )

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
      data-testid="card-face"
      style={resolveCardStyle(cardStyle, scheme) as CSSProperties}
      className={cn(
        'absolute inset-0 flex flex-col rounded-card-featured shadow-elevated backface-hidden',
        CARD_STYLE_SURFACE,
        back && 'transform-[rotateY(180deg)]',
        !active && 'pointer-events-none',
      )}
      inert={!active}
    >
      <header className="flex h-9 shrink-0 touch-none items-center justify-between gap-1.5 px-4 pt-2.5">
        <FlipButton onClick={face.onFlip} />
        <span className="flex items-center gap-1.5">
          {flagged ? (
            <Flag className="size-4 fill-rating text-(--rating-edge)" aria-hidden />
          ) : null}
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
        </span>
      </header>

      <div
        ref={setBody}
        data-card-scroll={scrolls ? '' : undefined}
        style={{ touchAction: scrolls ? 'pan-y' : 'none' }}
        className={cn(SCREEN_SCROLL, 'relative flex min-h-0 flex-1 flex-col px-5 pb-keyboard')}
      >
        <div
          ref={contentRef}
          className={cn(
            'flex w-full shrink-0 flex-col gap-3',
            CARD_STYLE_TEXT,
            align === 'center' ? 'my-auto' : 'mb-auto pt-1',
          )}
        >
          {children}
        </div>
      </div>

      <footer className="flex min-h-13 shrink-0 touch-none items-center justify-between gap-2 px-3 pb-(--p-safe-bottom) pt-1.5">
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
  className,
}: {
  label: string
  onClick: () => void
  tone?: 'solid' | 'quiet'
  className?: string
}) {
  return (
    <button
      type="button"
      onPointerDown={stopPress}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-control px-4 text-label font-semibold transition-transform active:scale-[0.97]',
        tone === 'solid'
          ? 'bg-info-surface text-heading'
          : 'text-muted-foreground active:bg-info-surface',
        className,
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

/**
 * Turning the card over, in the one place it is always reachable. A tap on the face cannot be
 * relied on for this: in tap mode the edges answer the card, and on a face full of blurred words
 * or tokens there may be no background left to hit.
 */
function FlipButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      data-flip
      aria-label={t('study.turnCard')}
      onPointerDown={stopPress}
      onClick={onClick}
      className="grid size-7 shrink-0 place-items-center rounded-control bg-info-surface text-heading transition-transform active:scale-90"
    >
      <FlipHorizontal2 className="size-3.5" aria-hidden />
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
          className="max-w-[36ch] text-pretty text-label italic text-muted-foreground"
        >
          {tip}
        </motion.p>
      ) : (
        <button
          type="button"
          onPointerDown={stopPress}
          onClick={() => setPeek(true)}
          className={pillSurface('warning')}
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
        <p className="text-label font-semibold text-heading">{t('study.whereToPicture')}</p>
      </div>
      <p className="text-label italic leading-relaxed text-muted-foreground">{hint}</p>
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

export function WorkPrompt({ prompt, tip }: { prompt: string; tip?: string }) {
  return (
    <>
      <div className="shrink-0 text-center">
        <h2 className="text-balance wrap-break-word text-card-title font-bold leading-tight tracking-[-0.01em] text-heading">
          {prompt}
        </h2>
        {tip ? <TipRow tip={tip} /> : null}
      </div>
      <div className="h-px shrink-0 bg-border" aria-hidden />
    </>
  )
}

export function BackPrompt({ prompt, onFlip }: { prompt: string; onFlip: () => void }) {
  const { t } = useTranslation()
  return (
    <>
      <FlipZone label={t('study.showFront')} onFlip={onFlip} className="shrink-0">
        <span className="block truncate text-center text-label font-semibold text-accent">
          {prompt}
        </span>
      </FlipZone>
      <div className="mx-auto h-px w-24 shrink-0 bg-border" aria-hidden />
    </>
  )
}
