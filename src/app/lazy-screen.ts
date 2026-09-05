import { lazyRouteComponent, type RouteComponent } from '@tanstack/react-router'

/**
 * One dynamic import, many routes. `lazyRouteComponent` takes the loader and the export name, so
 * binding the loader once per screen module lets `router.tsx` name a route's component without
 * importing it — which is the whole point: a static import would pull the module, and everything
 * it renders, back into the entry chunk.
 *
 * The loader is shared across every route in a module, so the chunk is fetched once however many
 * of its screens the session visits.
 */
export function lazyScreen<Exports extends Record<string, unknown>>(load: () => Promise<Exports>) {
  return <Name extends keyof Exports & string>(name: Name) =>
    lazyRouteComponent(load, name) as unknown as RouteComponent
}
