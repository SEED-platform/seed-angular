import type { OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import type { FormGroup } from '@angular/forms'
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { RouterLink } from '@angular/router'
import { finalize } from 'rxjs'
import { Animations } from '@seed/animations'
import type { AlertType } from '@seed/components'
import { AlertComponent } from '@seed/components'
import { SEEDValidators } from '@seed/validators'
import { AuthService } from 'app/core/auth/auth.service'

@Component({
  selector: 'auth-reset-password',
  templateUrl: './reset-password.component.html',
  encapsulation: ViewEncapsulation.None,
  animations: Animations,
  imports: [
    AlertComponent,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    RouterLink,
  ],
})
export class AuthResetPasswordComponent implements OnInit {
  private _authService = inject(AuthService)
  private _formBuilder = inject(FormBuilder)

  alert: { type: AlertType; message: string } = {
    type: 'success',
    message: '',
  }
  resetPasswordForm: FormGroup
  showAlert = false

  ngOnInit(): void {
    this.resetPasswordForm = this._formBuilder.group(
      {
        password: ['', Validators.required],
        passwordConfirm: ['', Validators.required],
      },
      {
        validators: SEEDValidators.mustMatch('password', 'passwordConfirm'),
      },
    )
  }

  /**
   * Reset password
   */
  resetPassword(): void {
    // Return if the form is invalid
    if (this.resetPasswordForm.invalid) {
      return
    }

    // Disable the form
    this.resetPasswordForm.disable()

    // Hide the alert
    this.showAlert = false

    // Send the request to the server
    this._authService
      .resetPassword(this.resetPasswordForm.get('password').value)
      .pipe(
        finalize(() => {
          // Re-enable the form
          this.resetPasswordForm.enable()

          this.resetPasswordForm.reset()

          this.showAlert = true
        }),
      )
      .subscribe({
        next: () => {
          // Set the alert
          this.alert = {
            type: 'success',
            message: 'Your password has been reset.',
          }
        },
        error: (/* response */) => {
          // Set the alert
          this.alert = {
            type: 'error',
            message: 'Something went wrong, please try again.',
          }
        },
      })
  }
}
