import { lazyRouteComponent, type RouteComponent } from '@tanstack/react-router'

export function lazyScreen<Exports extends Record<string, unknown>>(load: () => Promise<Exports>) {
  return <Name extends keyof Exports & string>(name: Name) =>
    lazyRouteComponent(load, name) as unknown as RouteComponent
}
