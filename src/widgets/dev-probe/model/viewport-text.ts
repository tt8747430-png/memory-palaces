import {
  checkViewport,
  type KeyboardEpisode,
  type ProbeCheck,
  type ViewportSample,
} from './viewport-sample'

export const SAMPLE_ROWS: [keyof ViewportSample, string][] = [
  ['route', 'route'],
  ['mode', 'display mode'],
  ['layoutHeight', 'layout viewport h'],
  ['layoutWidth', 'layout viewport w'],
  ['vvHeight', 'visualViewport h'],
  ['vvOffsetTop', 'visualViewport top'],
  ['vvScale', 'visualViewport scale'],
  ['appHeight', '--app-height'],
  ['kbInset', '--kb-inset'],
  ['kbRange', '--kb-range'],
  ['kbMeasured', '--kb-inset measured'],
  ['keyboardAttr', 'data-keyboard'],
  ['stored', 'remembered kb'],
  ['scroller', 'scroll body'],
  ['scrollTop', 'scrollTop'],
  ['scrollMax', 'scrollTop max'],
  ['padBottom', 'scroll padding-bottom'],
  ['htmlRectTop', 'html rect top'],
  ['rootRectTop', '#root rect top'],
  ['headerTop', 'header top'],
  ['headerBottom', 'header bottom'],
  ['footerTop', 'footer top'],
  ['bandTop', 'reveal band top'],
  ['bandBottom', 'reveal band bottom'],
  ['visibleBottom', 'visibleBottom()'],
  ['focused', 'focused element'],
  ['focusedTop', 'focused top'],
  ['focusedBottom', 'focused bottom'],
  ['revealDelta', 'reveal delta'],
  ['statusBarDeclared', '--status-bar'],
  ['statusBarMeta', 'theme-color'],
  ['statusBarPainted', 'painted under bar'],
]

const MARK: Record<ProbeCheck['state'], string> = { ok: 'ok  ', bad: 'FAIL', idle: '--  ' }

const LABEL_WIDTH = Math.max(...SAMPLE_ROWS.map(([, label]) => label.length))

const rowLines = (sample: ViewportSample) =>
  SAMPLE_ROWS.map(([key, label]) => `${label.padEnd(LABEL_WIDTH)}  ${String(sample[key])}`)

const checkLines = (sample: ViewportSample) =>
  checkViewport(sample).map(
    (check) => `${MARK[check.state]}  ${check.label.padEnd(18)}  ${check.detail}`,
  )

export function sampleToText(sample: ViewportSample): string {
  return [
    'mindscape viewport probe',
    new Date(sample.at).toISOString(),
    navigator.userAgent,
    '',
    ...rowLines(sample),
    '',
    ...checkLines(sample),
    '',
  ].join('\n')
}

function diffLines(before: ViewportSample, after: ViewportSample): string[] {
  const changed = SAMPLE_ROWS.filter(([key]) => String(before[key]) !== String(after[key]))
  if (changed.length === 0) return ['(nothing moved)']
  return changed.map(
    ([key, label]) =>
      `${label.padEnd(LABEL_WIDTH)}  ${String(before[key])} → ${String(after[key])}`,
  )
}

function episodeToText(episode: KeyboardEpisode, index: number, total: number): string {
  const { before, after, live } = episode
  const head = `═══ keyboard ${index + 1} of ${total}${live ? ' (live)' : ''} · ${new Date(after.at).toISOString()}`
  const body = before
    ? [
        `─── before (keyboard closed) ───`,
        ...rowLines(before),
        '',
        `─── after (+${after.at - before.at}ms) ───`,
        ...rowLines(after),
        '',
        '─── what the keyboard moved ───',
        ...diffLines(before, after),
      ]
    : [
        '─── before ───',
        '(none: the probe started with the keyboard already up)',
        '',
        '─── after ───',
        ...rowLines(after),
      ]
  return [head, '', ...body, '', ...checkLines(after)].join('\n')
}

export function episodesToText(episodes: KeyboardEpisode[]): string {
  if (episodes.length === 0) {
    return 'mindscape viewport probe\nno keyboard opened yet — focus a field, then copy.\n'
  }
  return [
    `mindscape viewport probe — ${episodes.length} keyboard${episodes.length === 1 ? '' : 's'}, oldest first`,
    navigator.userAgent,
    '',
    ...episodes.map((episode, index) => episodeToText(episode, index, episodes.length)),
    '',
  ].join('\n\n')
}

const TRACE_COLUMNS = [
  'at',
  'vvOffsetTop',
  'vvHeight',
  'kbInset',
  'kbRange',
  'scrollTop',
  'scrollMax',
  'padBottom',
  'htmlRectTop',
  'rootRectTop',
  'headerTop',
  'bandTop',
  'bandBottom',
  'visibleBottom',
  'focusedTop',
  'focusedBottom',
  'revealDelta',
] as const satisfies readonly (keyof ViewportSample)[]

export function traceToTsv(trace: ViewportSample[]): string {
  if (trace.length === 0) return ''
  const start = trace[0]?.at ?? 0
  const rows = trace.map((sample) =>
    TRACE_COLUMNS.map((key) => (key === 'at' ? sample.at - start : sample[key])).join('\t'),
  )
  return [TRACE_COLUMNS.join('\t'), ...rows].join('\n')
}
