import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Brain, Building2, MapPin, type LucideIcon } from 'lucide-react'
import { GlassCard } from '@/shared/ui'

const STEPS: { icon: LucideIcon; titleKey: 'home.step1Title' | 'home.step2Title' | 'home.step3Title'; bodyKey: 'home.step1Body' | 'home.step2Body' | 'home.step3Body' }[] = [
  { icon: Building2, titleKey: 'home.step1Title', bodyKey: 'home.step1Body' },
  { icon: MapPin, titleKey: 'home.step2Title', bodyKey: 'home.step2Body' },
  { icon: Brain, titleKey: 'home.step3Title', bodyKey: 'home.step3Body' },
]

/** First-run companion to the "Build your memory palace" card: a calm, three-step
 * primer on the method of loci. Shown only before the first palace exists, so the
 * home never displays empty streak grids or fake stats on day one. */
export function FirstRunGuide({ className }: { className?: string }) {
  const { t } = useTranslation()

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <GlassCard tone="card">
        <h3 className="mb-4 text-[length:var(--p-text-title)] font-bold text-heading">
          {t('home.howItWorks')}
        </h3>
        <ol className="space-y-4">
          {STEPS.map((step, index) => (
            <li key={step.titleKey} className="flex items-start gap-3.5">
              <span className="relative shrink-0">
                <span className="grid size-10 place-items-center rounded-card bg-info-surface text-info-foreground">
                  <step.icon className="size-5" aria-hidden />
                </span>
                <span className="absolute -left-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-primary text-[length:var(--p-text-tiny)] font-bold text-primary-foreground">
                  {index + 1}
                </span>
              </span>
              <span className="min-w-0 pt-0.5">
                <span className="block text-[length:var(--p-text-sub)] font-semibold text-heading">
                  {t(step.titleKey)}
                </span>
                <span className="block text-[length:var(--p-text-body)] leading-snug text-muted-foreground">
                  {t(step.bodyKey)}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </GlassCard>
    </motion.div>
  )
}
