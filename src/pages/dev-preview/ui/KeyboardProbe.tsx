import { Input } from '@/shared/ui'
import { useViewportProbe, ViewportReadout } from '@/widgets/dev-probe'

export function KeyboardProbe() {
  const { sample } = useViewportProbe()

  return (
    <div className="flex flex-col gap-3">
      <Input placeholder="Focus me, then read the numbers" aria-label="Keyboard probe field" />
      <ViewportReadout sample={sample} />
      <p className="text-(length:--p-text-label) leading-snug text-muted-foreground">
        Focus the field. <b>visualViewport top</b> is the number that matters: it should stay{' '}
        <b>0</b>. Above 0 means iOS panned the page itself, which it only does when the app failed
        to reveal its own field — check that <b>focused bottom</b> landed under{' '}
        <b>reveal band max</b>, and that <b>--kb-range</b> gave the scroll body room to get it
        there. Nothing in the app compensates for a pan any more, so one that happens is visible as
        the whole shell sliding up. <b>layout viewport h</b> dropping means the platform resized
        instead of panning, which needs nothing from us. The last row must balance. A fault that
        only shows in motion needs the probe overlay: turn it on in Settings → Developer and record
        a trace on the screen that misbehaves.
      </p>
    </div>
  )
}
