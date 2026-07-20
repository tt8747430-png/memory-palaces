/**
 * The progress area's React surface. Kept out of `@/progress` (the eager root barrel the
 * composition root imports) so a hook that pulls in `sonner` and `react-i18next` never lands
 * in the composition root's chunk.
 */
export { useSessionReward } from './use-session-reward'
