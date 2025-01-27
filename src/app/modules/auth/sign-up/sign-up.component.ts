import type { OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import type { FormGroup } from '@angular/forms'
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { Router, RouterLink } from '@angular/router'
import { Animations } from '@seed/animations'
import type { AlertType } from '@seed/components'
import { AlertComponent } from '@seed/components'
import { TermsService } from '@seed/services'
import { AuthService } from 'app/core/auth/auth.service'

@Component({
  selector: 'auth-sign-up',
  templateUrl: './sign-up.component.html',
  encapsulation: ViewEncapsulation.None,
  animations: Animations,
  imports: [
    AlertComponent,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    RouterLink,
  ],
})
export class AuthSignUpComponent implements OnInit {
  private _authService = inject(AuthService)
  private _formBuilder = inject(FormBuilder)
  private _router = inject(Router)
  private _termsOfServiceService = inject(TermsService)

  alert: { type: AlertType; message: string } = {
    type: 'success',
    message: '',
  }
  signUpForm: FormGroup
  showAlert = false

  ngOnInit(): void {
    this.signUpForm = this._formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      terms: [false, Validators.requiredTrue],
    })
  }

  showTermsOfService(): void {
    this._termsOfServiceService.showTermsOfService()
  }

  get isTermsInvalid() {
    return this.signUpForm.get('terms')?.invalid && this.signUpForm.get('terms')?.touched
  }

  signUp(): void {
    this.signUpForm.markAllAsTouched()

    // Do nothing if the form is invalid
    if (this.signUpForm.invalid) {
      return
    }

    // Disable the form
    this.signUpForm.disable()

    // Hide the alert
    this.showAlert = false

    // Sign up
    this._authService.signUp(this.signUpForm.value).subscribe({
      next: () => {
        // Navigate to the confirmation required page
        void this._router.navigateByUrl('/confirmation-required')
      },
      error: (/* response */) => {
        // Re-enable the form
        this.signUpForm.enable()

        this.signUpForm.reset()

        // Set the alert
        this.alert = {
          type: 'error',
          message: 'Something went wrong, please try again.',
        }

        this.showAlert = true
      },
    })
  }
}
