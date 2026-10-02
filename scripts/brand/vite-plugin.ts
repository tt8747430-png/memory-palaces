import type { HtmlTagDescriptor, Plugin } from 'vite'
import { SPLASH_MARK_PX } from '../../src/shared/config/brand-mark.ts'
import { STATUS_BAR } from '../../src/shared/config/status-bar.ts'
import { LAUNCH_SCREENS } from './launch-screens.ts'
import { bootMarkSvg } from './render.ts'

const ROOT = '<div id="root"></div>'

/**
 * The launch frame, from the tap to the splash. iOS shows the launch screen that matches the device;
 * then the page paints the same frame inside `#root` before any script has loaded; React's first
 * render replaces it with the splash, whose first frame is the same again. `index.html`'s boot
 * script has set `data-theme` by then, so the frame takes the learner's scheme.
 *
 * Its style is inline and its colours literal: in development the stylesheet arrives with the script.
 */
export function brandLaunch(): Plugin {
  const style = [
    `.boot-splash{position:fixed;inset:0;background:${STATUS_BAR.light}}`,
    `[data-theme='dark'] .boot-splash{background:${STATUS_BAR.dark}}`,
    `.boot-splash svg{position:absolute;left:50%;top:50%;width:${SPLASH_MARK_PX}px;height:${SPLASH_MARK_PX}px;transform:translate(-50%,-50%)}`,
  ].join('')

  const tags: HtmlTagDescriptor[] = [
    { tag: 'style', children: style, injectTo: 'head' },
    ...LAUNCH_SCREENS.map(({ file, media }): HtmlTagDescriptor => ({
      tag: 'link',
      attrs: { rel: 'apple-touch-startup-image', media, href: `/${file}` },
      injectTo: 'head',
    })),
  ]

  return {
    name: 'brand-launch',
    transformIndexHtml(html) {
      if (!html.includes(ROOT)) throw new Error(`index.html has no empty ${ROOT} to paint into.`)
      return {
        html: html.replace(
          ROOT,
          `<div id="root"><div class="boot-splash">${bootMarkSvg()}</div></div>`,
        ),
        tags,
      }
    },
  }
}
