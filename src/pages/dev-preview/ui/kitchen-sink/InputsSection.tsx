import { useState } from 'react'
import { Mail } from 'lucide-react'
import { AuthField, Combobox, Input, PasswordField, Textarea } from '@/shared/ui'
import { Section, Cases, Case } from './layout'
import { LONG_TEXT } from './fixtures'

function ComboboxDemo() {
  const [value, setValue] = useState<'bible' | 'notes' | 'csv'>('notes')
  return (
    <Combobox
      label="Import format"
      value={value}
      onChange={setValue}
      options={[
        { value: 'notes', label: 'Notes' },
        { value: 'bible', label: 'Bible' },
        { value: 'csv', label: 'CSV' },
      ]}
    />
  )
}

function AuthFieldsDemo() {
  const [email, setEmail] = useState('ada@example.com')
  const [broken, setBroken] = useState('not-an-email')
  const [password, setPassword] = useState('hunter2')
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <AuthField
        id="demo-email"
        label="Email"
        value={email}
        onValueChange={setEmail}
        icon={<Mail />}
        valid
      />
      <AuthField
        id="demo-email-error"
        label="Email"
        value={broken}
        onValueChange={setBroken}
        icon={<Mail />}
        error="Enter a valid email address"
      />
      <PasswordField
        id="demo-password"
        label="Password"
        value={password}
        onValueChange={setPassword}
      />
    </div>
  )
}

export function InputsSection() {
  return (
    <Section
      id="inputs"
      title="Inputs & fields"
      note="Default, disabled, error, and long values — check placeholder contrast and truncation."
    >
      <div className="flex flex-col gap-5">
        <Cases>
          <Case label="input" full>
            <Input defaultValue="Cranial nerves" aria-label="Sample input" />
          </Case>
          <Case label="placeholder" full>
            <Input placeholder="Deck name" aria-label="Placeholder input" />
          </Case>
          <Case label="disabled" full>
            <Input defaultValue="Locked" disabled aria-label="Disabled input" />
          </Case>
          <Case label="textarea" full>
            <Textarea defaultValue={LONG_TEXT} rows={3} aria-label="Sample textarea" />
          </Case>
        </Cases>
        <div className="border-t border-border pt-4">
          <ComboboxDemo />
        </div>
        <div className="border-t border-border pt-4">
          <AuthFieldsDemo />
        </div>
      </div>
    </Section>
  )
}
