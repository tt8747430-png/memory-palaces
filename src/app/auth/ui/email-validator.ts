import type { ValidatorFn } from '@angular/forms'
import { isEmail } from '@app/shared/domain'

/** Valid when empty (pair with Validators.required) or a well-formed address. */
export const emailValidator: ValidatorFn = (control) =>
  !control.value || isEmail(control.value) ? null : { email: true }
