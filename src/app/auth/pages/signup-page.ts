import { Component, inject, signal } from '@angular/core'
import { Router } from '@angular/router'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInput } from '@angular/material/input'
import { MatButton, MatIconButton } from '@angular/material/button'
import { MatCheckbox } from '@angular/material/checkbox'
import { LucideAngularModule, Mail, Lock, User, Eye, EyeOff } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'
import { ROUTES } from '@app/shared/config/routes'
import { LEGAL_URLS } from '@app/shared/config/constants'
import { AuthScreen } from '@app/shared/ui/auth-screen'
import { AuthLogo } from '@app/shared/ui/auth-logo'
import { SocialButtons } from '../ui/social-buttons'
import { AuthActions } from '../ui/auth-actions'
import { emailValidator } from '../ui/email-validator'

const MIN_PASSWORD = 8

@Component({
  selector: 'ms-signup-page',
  imports: [
    AuthScreen,
    AuthLogo,
    SocialButtons,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInput,
    MatButton,
    MatIconButton,
    MatCheckbox,
    LucideAngularModule,
    TranslocoPipe,
  ],
  templateUrl: './signup-page.html',
  styleUrl: './auth-pages.css',
})
export class SignupPage {
  private readonly actions = inject(AuthActions)
  private readonly router = inject(Router)

  protected readonly icons = { mail: Mail, lock: Lock, user: User, eye: Eye, eyeOff: EyeOff }
  protected readonly legal = LEGAL_URLS
  protected readonly busy = signal(false)
  protected readonly showPassword = signal(false)
  protected readonly loginPath = ROUTES.login

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, emailValidator],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(MIN_PASSWORD)],
    }),
    terms: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  })

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }
    this.busy.set(true)
    const { name, email } = this.form.getRawValue()
    await this.actions.signUp({ name: name.trim(), email: email.trim() })
    await this.router.navigateByUrl(ROUTES.welcome)
  }

  protected async guest(): Promise<void> {
    await this.actions.continueAsGuest()
    await this.router.navigateByUrl(ROUTES.home)
  }

  protected go(path: string): void {
    void this.router.navigateByUrl(path)
  }
}
