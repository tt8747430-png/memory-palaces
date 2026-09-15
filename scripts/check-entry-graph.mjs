#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const INDEX = fileURLToPath(new URL('../dist/index.html', import.meta.url))

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
