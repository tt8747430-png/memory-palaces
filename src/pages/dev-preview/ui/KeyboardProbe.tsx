import { Input } from '@/shared/ui'
import {
  BandDiagram,
  CopyButton,
  episodesToText,
  EPISODE_LIMIT,
  sampleToText,
  useViewportProbe,
  ViewportReadout,
} from '@/widgets/dev-probe'

export function KeyboardProbe() {
  const { sample, episodes, episodeCount } = useViewportProbe()

  return (
    <div className="flex flex-col gap-3">
      <Input placeholder="Focus me, then read the numbers" aria-label="Keyboard probe field" />
      <BandDiagram sample={sample} />
      <div className="flex flex-wrap items-center gap-1.5">
        <CopyButton
          label={`copy ${episodeCount} keyboard${episodeCount === 1 ? '' : 's'}`}
          text={() => episodesToText(episodes())}
        />
        <CopyButton label="copy this reading" text={() => sampleToText(sample)} />
      </div>
      <p className="text-(length:--p-text-tiny) text-muted-foreground">
        Each keyboard is kept as a pair — the resting reading it interrupted, the reading it settled
        into, and the diff between them. The last {EPISODE_LIMIT} are copied at once, so a fault and
        the state it came from travel together.
      </p>
      <ViewportReadout sample={sample} />
      <p className="text-(length:--p-text-label) leading-snug text-muted-foreground">
        Focus the field. <b>visualViewport top</b> is the number that matters: it should stay{' '}
        <b>0</b>. Above 0 means iOS panned the page itself, which it only does when the app failed
        to reveal its own field — check that <b>reveal delta</b> came back to <b>0</b>, and that{' '}
        <b>scroll range</b> gave the scroll body room to get it there. Nothing in the app
        compensates for a pan any more, so one that happens is visible as the whole shell sliding
        up. <b>layout viewport h</b> dropping means the platform resized instead of panning, which
        needs nothing from us. A fault that only shows in motion needs the probe overlay: turn it on
        in Settings → Developer and record a trace on the screen that misbehaves.
      </p>
    </div>
  )
}
