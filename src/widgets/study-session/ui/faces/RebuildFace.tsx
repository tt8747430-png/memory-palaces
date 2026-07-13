import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { cn, scramble, tokenizeWords } from '@/shared/lib'
import { AidButton, CardFace, TipRow } from './CardFace'
import { type FaceProps, stopPress, useSwipeMechanic } from './types'

interface WordChip {
  pos: number
  word: string
  key: string
}

const WRONG_CHIP_MS = 450

export function RebuildFace(props: FaceProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const { card, answer, prompt, canSpeak, active, onSpeak } = props
  const words = useMemo(() => tokenizeWords(answer), [answer])
  const chips = useMemo<WordChip[]>(
    () => scramble(words.map((word, pos) => ({ pos, word, key: `${pos}-${word}` }))),
    [words],
  )
  const [usedKeys, setUsedKeys] = useState<Set<string>>(() => new Set())
  const [wrongKey, setWrongKey] = useState<string | null>(null)
  const placed = usedKeys.size
  const done = words.length > 0 && placed >= words.length

  useEffect(() => {
    if (done) props.onRevealInPlace()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  const tapChip = (chip: WordChip) => {
    if (usedKeys.has(chip.key)) return
    if (chip.word === words[placed]) {
      setUsedKeys((prev) => new Set(prev).add(chip.key))
      setWrongKey(null)
    } else {
      setWrongKey(chip.key)
      window.setTimeout(() => setWrongKey((k) => (k === chip.key ? null : k)), WRONG_CHIP_MS)
    }
  }

  const reset = () => {
    setUsedKeys(new Set())
    setWrongKey(null)
    props.onHideInPlace()
  }

  useSwipeMechanic(active, props.registerMechanic, { reset })

  return (
    <CardFace
      flagged={card.card.flagged}
      canSpeak={canSpeak}
      speakText={prompt}
      onSpeak={onSpeak}
      active={active}
      mode={props.mode}
      onChangeMode={props.onChangeMode}
      onOpenGear={props.onOpenGear}
      align="start"
      footer={placed > 0 ? <AidButton label={t('study.reset')} onClick={reset} /> : null}
    >
      <div className="shrink-0 text-center">
        <h2 className="text-balance wrap-break-word text-[clamp(18px,5vw,22px)] font-bold leading-tight tracking-[-0.01em] text-heading">
          {prompt}
        </h2>
        {card.card.tip ? <TipRow tip={card.card.tip} /> : null}
      </div>
      <div className="h-px shrink-0 bg-border" aria-hidden />

      <p
        className={cn(
          'min-h-8 text-balance text-center text-[clamp(16px,4.4vw,20px)] font-semibold leading-relaxed',
          done ? 'text-(--success-foreground)' : 'text-heading',
        )}
      >
        {placed === 0 ? (
          <span className="text-(length:--p-text-body) font-medium text-muted-foreground">
            {t('study.rebuildHint')}
          </span>
        ) : (
          words.slice(0, placed).join(' ')
        )}
      </p>

      {/* Rebuilding the answer is the answer: once it is whole, the tray of spent words goes
          and only Reset brings the exercise back. */}
      {done ? null : (
        <div className="flex flex-wrap justify-center gap-2">
          {chips.map((chip) => {
            const used = usedKeys.has(chip.key)
            const isWrong = wrongKey === chip.key
            return (
              <motion.button
                key={chip.key}
                type="button"
                disabled={used}
                onPointerDown={stopPress}
                onClick={() => !used && tapChip(chip)}
                animate={isWrong && !reduce ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                className={cn(
                  'rounded-full px-3.5 py-2 text-(length:--p-text-sub) font-semibold transition-colors',
                  used
                    ? 'bg-info-surface text-muted-foreground opacity-40'
                    : isWrong
                      ? 'bg-(--danger-surface) text-(--danger-on-surface) ring-2 ring-destructive'
                      : 'bg-secondary/20 text-heading',
                )}
              >
                {chip.word}
              </motion.button>
            )
          })}
        </div>
      )}
    </CardFace>
  )
}
