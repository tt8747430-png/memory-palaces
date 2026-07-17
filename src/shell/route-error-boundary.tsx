import { isRouteErrorResponse, useRouteError } from 'react-router'
import { Button } from '@/shared/ui/button'

export function RouteErrorBoundary() {
  const error = useRouteError()
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : null

  return (
    <div role="alert" className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
      <h1>Something went wrong</h1>
      {detail ? <p className="text-center">{detail}</p> : null}
      <Button onClick={() => window.location.assign('/')}>Back to home</Button>
    </div>
  )
}
