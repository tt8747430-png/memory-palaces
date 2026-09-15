#!/usr/bin/env node
/**
 * Asserts that the heavy dependencies stay out of the entry graph.
 *
 * `createServices()` reaches RxDB, Dexie and supabase-js through `await import(...)` so the first
 * paint does not wait on ~500 kB the splash is already covering. Nothing about that is visible in
 * a type check or a test: one accidental static import anywhere under the entry module puts them
 * back, silently, and Vite would happily emit a `modulepreload` for them. This is the check that
 * notices.
 *
 * It reads `dist/index.html` rather than the module graph, because the preload tags are exactly
 * what the browser acts on.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const INDEX = fileURLToPath(new URL('../dist/index.html', import.meta.url))

/** Chunk names from `build.rollupOptions.output.advancedChunks` in vite.config.ts. */
const FORBIDDEN = ['persistence', 'supabase']

const preloadedChunks = (html) =>
  [...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)].map(([, href]) => href)

const main = async () => {
  let html
  try {
    html = await readFile(INDEX, 'utf8')
  } catch {
    console.error(`check:entry-graph — ${INDEX} not found. Run \`npm run build\` first.`)
    process.exit(1)
  }

  const preloaded = preloadedChunks(html)
  const offenders = preloaded.filter((href) =>
    FORBIDDEN.some((name) => /([^/]+)$/.exec(href)?.[1]?.startsWith(`${name}-`)),
  )

  if (offenders.length) {
    console.error(
      'check:entry-graph — these chunks are preloaded by the entry document and must not be:\n' +
        offenders.map((href) => `  ${href}`).join('\n') +
        '\n\nSomething now imports RxDB, Dexie or supabase-js statically from the entry graph.\n' +
        'Move it behind an `await import(...)` inside createServices().',
    )
    process.exit(1)
  }

  console.log(`check:entry-graph — ok (${preloaded.length} entry preloads, none forbidden)`)
}

await main()
