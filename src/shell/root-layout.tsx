import { Outlet } from 'react-router'
import { UpdatePrompt } from './update-prompt'

export function RootLayout() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
      <UpdatePrompt />
    </div>
  )
}
