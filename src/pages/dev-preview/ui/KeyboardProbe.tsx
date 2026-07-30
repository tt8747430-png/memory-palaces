import { Input } from '@/shared/ui'
import { useViewportProbe, ViewportReadout } from '@/widgets/dev-probe'

export function KeyboardProbe() {
  const { sample } = useViewportProbe()

  return (
    <div className="flex flex-col gap-3">
      <Input placeholder="Focus me, then read the numbers" aria-label="Keyboard probe field" />
      <ViewportReadout sample={sample} />
      <p className="text-(length:--p-text-label) leading-snug text-muted-foreground">
        Focus the field. <b>visualViewport top</b> above 0 means iOS panned;{' '}
        <b>layout viewport h</b> dropping means it resized instead. <b>--pan-comp</b> is how far the
        shell rode off the top, classified by{' '}
        <b>visualViewport top + html rect top − fixed box top</b> on every resize and settle — it
        must be 0 wherever the platform kept fixed boxes on screen, or the header is moved twice. It
        tracks the pan every frame; <b>--pan-pad</b> is the same number held still until you stop
        scrolling, because it feeds a layout property. <b>focused bottom</b> must stay under{' '}
        <b>reveal band max</b>, and the last row must balance. A fault that only shows in motion
        needs the probe overlay: turn it on in Settings → Developer and record a trace on the screen
        that misbehaves.
      </p>
    </div>
  )
}
