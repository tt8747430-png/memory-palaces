import { Component, inject, signal } from '@angular/core'
import { Router } from '@angular/router'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInput } from '@angular/material/input'
import { MatButton } from '@angular/material/button'
import { LucideAngularModule, ArrowLeft, Mail, MailCheck } from 'lucide-angular'
import { TranslocoPipe } from '@jsverse/transloco'
import { ROUTES } from '@app/shared/config/routes'
import { AuthScreen } from '@app/shared/ui/auth-screen'
import { AuthLogo } from '@app/shared/ui/auth-logo'
import { AuthActions } from '../ui/auth-actions'
import { emailValidator } from '../ui/email-validator'

const RESEND_SECONDS = 30

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain || !local) return email
  const head = local.slice(0, Math.min(2, local.length))
  return `${head}${'•'.repeat(Math.max(3, local.length - head.length))}@${domain}`
}

@Component({
  selector: 'ms-forgot-password-page',
  imports: [
    AuthScreen,
    AuthLogo,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInput,
    MatButton,
    LucideAngularModule,
    TranslocoPipe,
  ],
  templateUrl: './forgot-password-page.html',
  styleUrl: './auth-pages.css',
})
export class ForgotPasswordPage {
  private readonly actions = inject(AuthActions)
  private readonly router = inject(Router)

  protected readonly icons = { back: ArrowLeft, mail: Mail, sent: MailCheck }
  protected readonly busy = signal(false)
  protected readonly sent = signal(false)
  protected readonly cooldown = signal(0)

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, emailValidator],
    }),
  })

  protected maskedEmail(): string {
    return maskEmail(this.form.getRawValue().email.trim())
  }

  protected back(): void {
    void this.router.navigateByUrl(ROUTES.login)
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }
    await this.send()
  }

  protected async send(): Promise<void> {
    this.busy.set(true)
    await this.actions.requestPasswordReset(this.form.getRawValue().email.trim())
    this.busy.set(false)
    this.sent.set(true)
    this.cooldown.set(RESEND_SECONDS)
    this.tick()
  }

  private tick(): void {
    if (this.cooldown() <= 0) return
    setTimeout(() => {
      this.cooldown.update((value) => value - 1)
      this.tick()
    }, 1000)
  }
}
