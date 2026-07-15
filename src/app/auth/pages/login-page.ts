import { Component, inject, signal } from '@angular/core'
import { Router } from '@angular/router'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInput } from '@angular/material/input'
import { MatButton, MatIconButton } from '@angular/material/button'
import { LucideAngularModule, Mail, Lock, Eye, EyeOff } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'
import { ROUTES } from '@app/shared/config/routes'
import { AuthScreen } from '@app/shared/ui/auth-screen'
import { AuthLogo } from '@app/shared/ui/auth-logo'
import { SocialButtons } from '../ui/social-buttons'
import { AuthActions } from '../ui/auth-actions'
import { emailValidator } from '../ui/email-validator'

@Component({
  selector: 'ms-login-page',
  imports: [
    AuthScreen,
    AuthLogo,
    SocialButtons,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInput,
    MatButton,
    MatIconButton,
    LucideAngularModule,
    TranslocoPipe,
  ],
  templateUrl: './login-page.html',
  styleUrl: './auth-pages.css',
})
export class LoginPage {
  private readonly actions = inject(AuthActions)
  private readonly router = inject(Router)

  protected readonly icons = { mail: Mail, lock: Lock, eye: Eye, eyeOff: EyeOff }
  protected readonly busy = signal(false)
  protected readonly showPassword = signal(false)

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, emailValidator],
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  })

  protected readonly signupPath = ROUTES.signup
  protected readonly forgotPath = ROUTES.forgot

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }
    this.busy.set(true)
    await this.actions.signIn(this.form.getRawValue().email.trim())
    await this.router.navigateByUrl(ROUTES.home)
  }

  protected async guest(): Promise<void> {
    await this.actions.continueAsGuest()
    await this.router.navigateByUrl(ROUTES.home)
  }

  protected go(path: string): void {
    void this.router.navigateByUrl(path)
  }
}
