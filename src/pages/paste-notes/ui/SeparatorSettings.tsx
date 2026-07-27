import { useTranslation } from 'react-i18next'
import { ArrowUpDown, Table } from 'lucide-react'
import { Input, OptionGroup, ToggleRow } from '@/shared/ui'
import {
  type CardSep,
  displaySep,
  type FieldSep,
  type PasteParsing,
} from '../model/use-paste-parsing'

/** How delimited text is cut into cards: the field split, the card split, and two corrections. */
export function SeparatorSettings({ parsing }: { parsing: PasteParsing }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-5">
      <OptionGroup<FieldSep>
        label={t('cards.paste.fieldLabel')}
        value={parsing.fieldSep}
        onChange={parsing.setFieldSep}
        options={[
          {
            value: 'auto',
            label: t('cards.paste.sepAuto'),
            hint: parsing.text.trim() ? displaySep(parsing.guessedField) : undefined,
          },
          { value: 'tab', label: t('cards.paste.sepTab'), hint: '⇥' },
          { value: 'comma', label: t('cards.paste.sepComma'), hint: ',' },
          { value: 'custom', label: t('cards.paste.sepCustom') },
        ]}
        footer={
          parsing.fieldSep === 'custom' ? (
            <CustomSeparator
              value={parsing.customField}
              onChange={parsing.setCustomField}
              placeholder={t('cards.paste.customFieldPlaceholder')}
            />
          ) : undefined
        }
      />

      <OptionGroup<CardSep>
        label={t('cards.paste.cardLabel')}
        value={parsing.cardSep}
        onChange={parsing.setCardSep}
        options={[
          { value: 'newline', label: t('cards.paste.sepNewline'), hint: '↵' },
          { value: 'semicolon', label: t('cards.paste.sepSemicolon'), hint: ';' },
          { value: 'custom', label: t('cards.paste.sepCustom') },
        ]}
        footer={
          parsing.cardSep === 'custom' ? (
            <CustomSeparator
              value={parsing.customCard}
              onChange={parsing.setCustomCard}
              placeholder={t('cards.paste.customCardPlaceholder')}
            />
          ) : undefined
        }
      />

      <div className="divide-y divide-border overflow-hidden rounded-card border border-border bg-card shadow-rest">
        <ToggleRow
          surface="plain"
          icon={<SettingGlyph icon={<ArrowUpDown className="size-[18px]" aria-hidden />} />}
          label={t('cards.paste.swapLabel')}
          description={t('cards.paste.swapHint')}
          checked={parsing.swap}
          onChange={parsing.setSwap}
        />
        <ToggleRow
          surface="plain"
          icon={<SettingGlyph icon={<Table className="size-[18px]" aria-hidden />} />}
          label={t('cards.paste.skipHeaderLabel')}
          description={t('cards.paste.skipHeaderHint')}
          checked={parsing.skipHeader}
          onChange={parsing.setSkipHeader}
        />
      </div>
    </div>
  )
}

function SettingGlyph({ icon }: { icon: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className="grid size-8 shrink-0 place-items-center rounded-control bg-info-surface text-primary"
    >
      {icon}
    </span>
  )
}

function CustomSeparator({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="p-3">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="font-mono"
        autoFocus
      />
    </div>
  )
}
