import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Bell } from 'lucide-react'
import { SettingsRow } from './SettingsRow'

afterEach(cleanup)

describe('SettingsRow', () => {
  it('toggle kind exposes a switch that fires onCheckedChange', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(
      <SettingsRow
        kind="toggle"
        icon={<Bell />}
        label="Notifications"
        checked
        onCheckedChange={onCheckedChange}
      />,
    )
    await user.click(screen.getByRole('switch', { name: 'Notifications' }))
    expect(onCheckedChange).toHaveBeenCalledWith(false)
  })

  it('nav kind fires onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<SettingsRow kind="nav" icon={<Bell />} label="Privacy" onClick={onClick} />)
    await user.click(screen.getByRole('button', { name: 'Privacy' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('soon kind is disabled and shows the badge', () => {
    render(<SettingsRow kind="soon" icon={<Bell />} label="Dark mode" badge="Soon" />)
    const button = screen.getByRole('button', { name: 'Dark mode' })
    expect(button).toBeDisabled()
    expect(screen.getByText('Soon')).toBeInTheDocument()
  })

  it('value kind renders its value and is not a button', () => {
    render(<SettingsRow kind="value" icon={<Bell />} label="Email" value="ada@x.io" />)
    expect(screen.getByText('ada@x.io')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('info kind states its label and description, with nothing trailing and nothing to press', () => {
    const { container } = render(
      <SettingsRow kind="info" icon={<Bell />} label="Up to date" description="Nothing waits" />,
    )
    expect(screen.getByText('Up to date')).toBeInTheDocument()
    expect(screen.getByText('Nothing waits')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(container.querySelector('.shrink-0.text-label')).toBeNull()
  })
})
