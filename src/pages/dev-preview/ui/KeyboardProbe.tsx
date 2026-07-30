import { useEffect, useRef, useState } from 'react'
import { visibleBottom } from '@/shared/lib'
import { Input } from '@/shared/ui'

interface Sample {
  layoutHeight: number
  layoutWidth: number
  vvHeight: number
  vvOffsetTop: number
  appHeight: string
  kbInset: string
  vvTop: string
  scrollTop: number
  htmlRectTop: number
  rootRectTop: number
  visibleBottom: number
  headerBottom: number
  footerTop: number
  focused: string
  focusedTop: number
  focusedBottom: number
  stored: string
  at: number
}

function read(): Sample {
  const root = document.documentElement
  const vv = window.visualViewport
  const style = root.style
  const active = document.activeElement
  const scroller = document.querySelector('main')
  const header = document.querySelector('[data-slot="header-bar"]')
  const footer = document.querySelector('[data-slot="footer-bar"]')
  const rect = active instanceof HTMLElement ? active.getBoundingClientRect() : undefined
  return {
    layoutHeight: root.clientHeight,
    layoutWidth: root.clientWidth,
    vvHeight: Math.round(vv?.height ?? 0),
    vvOffsetTop: Math.round(vv?.offsetTop ?? 0),
    appHeight: style.getPropertyValue('--app-height') || '(unset)',
    kbInset: style.getPropertyValue('--kb-inset') || '(unset)',
    vvTop: style.getPropertyValue('--vv-top') || '(unset)',
    scrollTop: Math.round(scroller?.scrollTop ?? -1),
    htmlRectTop: Math.round(root.getBoundingClientRect().top),
    rootRectTop: Math.round(document.getElementById('root')?.getBoundingClientRect().top ?? -1),
    visibleBottom: Math.round(visibleBottom()),
    headerBottom: Math.round(header?.getBoundingClientRect().bottom ?? -1),
    footerTop: Math.round(footer?.getBoundingClientRect().top ?? -1),
    focused: active?.tagName.toLowerCase() ?? '(none)',
    focusedTop: Math.round(rect?.top ?? -1),
    focusedBottom: Math.round(rect?.bottom ?? -1),
    stored: localStorage.getItem('mindscape.keyboard-height') ?? '(none)',
    at: Date.now(),
  }
}

const ROWS: [keyof Sample, string][] = [
  ['layoutHeight', 'layout viewport h'],
  ['layoutWidth', 'layout viewport w'],
  ['vvHeight', 'visualViewport h'],
  ['vvOffsetTop', 'visualViewport top'],
  ['appHeight', '--app-height'],
  ['kbInset', '--kb-inset'],
  ['vvTop', '--vv-top'],
  ['scrollTop', 'main scrollTop'],
  ['htmlRectTop', 'html rect top'],
  ['rootRectTop', '#root rect top'],
  ['visibleBottom', 'reveal band max'],
  ['headerBottom', 'header bottom'],
  ['footerTop', 'footer top'],
  ['focused', 'focused element'],
  ['focusedTop', 'focused top'],
  ['focusedBottom', 'focused bottom'],
  ['stored', 'remembered kb'],
]

export function KeyboardProbe() {
  const [sample, setSample] = useState<Sample>(() => read())
  const frame = useRef(0)

  useEffect(() => {
    const tick = () => {
      setSample(read())
      frame.current = window.requestAnimationFrame(tick)
    }
    frame.current = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame.current)
  }, [])

  const sum = sample.vvOffsetTop + sample.vvHeight + parseInt(sample.kbInset || '0', 10)
  const anchored = parseInt(sample.appHeight || '0', 10)

  return (
    <div className="flex flex-col gap-3">
      <Input placeholder="Focus me, then read the numbers" aria-label="Keyboard probe field" />
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-(length:--p-text-tiny) tabular-nums">
        {ROWS.map(([key, label]) => (
          <div key={key} className="contents">
            <dt className="truncate text-muted-foreground">{label}</dt>
            <dd className="truncate text-heading">{String(sample[key])}</dd>
          </div>
        ))}
        <dt className="truncate text-muted-foreground">top+vv+kb</dt>
        <dd className={sum === anchored ? 'text-heading' : 'text-(--danger-on-surface)'}>
          {sum} {sum === anchored ? '= anchored' : `≠ ${anchored}`}
        </dd>
      </dl>
      <p className="text-(length:--p-text-label) leading-snug text-muted-foreground">
        Focus the field. <b>visualViewport top</b> above 0 means iOS panned;{' '}
        <b>layout viewport h</b> dropping means it resized instead. <b>html rect top</b> is the one
        that says which coordinate space rects use — 0 means layout-relative, -(pan) means the pan
        is already baked in. <b>focused bottom</b> must stay under <b>reveal band max</b>, and the
        last row must balance.
      </p>
    </div>
  )
}
