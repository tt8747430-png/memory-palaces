import { Bell } from 'lucide-react'
import { Button, GradeButtons, IconButton } from '@/shared/ui'
import { Section } from './layout'

const BUTTON_VARIANTS = ['default', 'secondary', 'ghost', 'destructive'] as const
const BUTTON_SIZES = ['sm', 'md', 'lg'] as const
const ICON_BUTTON_VARIANTS = ['ghost', 'tint', 'solid', 'glass', 'danger'] as const

export function ButtonsSection() {
  return (
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
  )
}
