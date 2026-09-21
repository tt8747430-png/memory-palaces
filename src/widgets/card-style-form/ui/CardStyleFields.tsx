import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlignCenter, AlignLeft, AlignRight, Type } from 'lucide-react'
import { CARD_ALIGNMENTS, CARD_FONTS, type CardAlignment, type CardStyle } from '@/entities/deck'
import { clampCardTextSize } from '@/shared/lib'
import {
  ActionSheet,
  SegmentedControl,
  SettingsRow,
  SettingsSection,
  StepperRow,
} from '@/shared/ui'
import { PresetStrip } from './PresetStrip'

const SIZE_STEP = 2

const ALIGN_ICONS: Record<CardAlignment, typeof AlignLeft> = {
  left: AlignLeft,
  center: AlignCenter,
  right: AlignRight,
}

const ALIGN_LABEL_KEYS: Record<CardAlignment, string> = {
  left: 'cardStyle.alignLeft',
  center: 'cardStyle.alignCenter',
  right: 'cardStyle.alignRight',
}

export interface CardStyleFieldsProps {
  style: CardStyle
  onChange: (style: CardStyle) => void
}

/**
 * Everything that makes up a card style, in one place. It belongs to nothing in particular — the
 * deck's own style screen and the sheet that pushes a style onto a selection both compose a whole
 * `CardStyle` here, so neither can drift into applying only part of one.
 */
export function CardStyleFields({ style, onChange }: CardStyleFieldsProps) {
  const { t } = useTranslation()
  const [fontOpen, setFontOpen] = useState(false)

  const edit = (patch: Partial<CardStyle>) => onChange({ ...style, ...patch })
  const step = (delta: number) => edit({ textSize: clampCardTextSize(style.textSize + delta) })

  return (
    <>
      <PresetStrip style={style} value={style.preset} onChange={(preset) => edit({ preset })} />

      <SettingsSection>
        <SettingsRow
          kind="nav"
          icon={<Type />}
          label={t('cardStyle.font')}
          value={t(`cardStyle.fontName.${style.font}` as never)}
          onClick={() => setFontOpen(true)}
        />
        <StepperRow
          label={t('cardStyle.textSize')}
          value={String(style.textSize)}
          decreaseLabel={t('cardStyle.decrease')}
          increaseLabel={t('cardStyle.increase')}
          onDecrease={() => step(-SIZE_STEP)}
          onIncrease={() => step(SIZE_STEP)}
        />
      </SettingsSection>

      <section className="flex flex-col gap-2">
        <h2 className="px-1 text-label font-semibold text-muted-foreground">
          {t('cardStyle.alignment')}
        </h2>
        <SegmentedControl
          aria-label={t('cardStyle.alignment')}
          value={style.alignment}
          onChange={(alignment) => edit({ alignment })}
          options={CARD_ALIGNMENTS.map((alignment) => {
            const Icon = ALIGN_ICONS[alignment]
            return {
              value: alignment,
              ariaLabel: t(ALIGN_LABEL_KEYS[alignment] as never),
              label: <Icon className="size-4.5" aria-hidden />,
            }
          })}
        />
      </section>

      <ActionSheet
        open={fontOpen}
        onOpenChange={setFontOpen}
        title={t('cardStyle.fontTitle')}
        cancelLabel={t('common.cancel')}
        actions={CARD_FONTS.map((font) => ({
          id: font,
          label: t(`cardStyle.fontName.${font}` as never),
          selected: font === style.font,
          onSelect: () => edit({ font }),
        }))}
      />
    </>
  )
}
