import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { Field, FieldControl, FieldDescription, FieldError, FieldLabel } from './field'

afterEach(cleanup)

describe('Field', () => {
  it('associates the label with its control', () => {
    renderWithProviders(
      <Field>
        <FieldLabel>Email</FieldLabel>
        <FieldControl />
      </Field>,
    )
    expect(screen.getByLabelText('Email')).toHaveAttribute('data-slot', 'field-control')
  })

  it('describes the control with its description text', () => {
    renderWithProviders(
      <Field>
        <FieldLabel>Email</FieldLabel>
        <FieldControl />
        <FieldDescription>We never share it.</FieldDescription>
      </Field>,
    )
    const control = screen.getByLabelText('Email')
    const description = screen.getByText('We never share it.')
    expect(control.getAttribute('aria-describedby')).toBe(description.id)
  })

  it('renders the error message when the field is invalid', () => {
    renderWithProviders(
      <Field invalid>
        <FieldLabel>Email</FieldLabel>
        <FieldControl aria-invalid />
        <FieldError match>Email is required</FieldError>
      </Field>,
    )
    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })
})
