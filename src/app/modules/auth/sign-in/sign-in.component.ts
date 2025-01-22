import type { OnInit } from '@angular/core'
import { Component, inject, ViewChild, ViewEncapsulation } from '@angular/core'
import type { NgForm, UntypedFormGroup } from '@angular/forms'
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { Animations } from '@seed/animations'
import type { AlertType } from '@seed/components'
import { AlertComponent } from '@seed/components'
import { TermsService } from '@seed/services'
import { AuthService } from 'app/core/auth/auth.service'

@Component({
  selector: 'auth-sign-in',
  templateUrl: './sign-in.component.html',
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
export class AuthSignInComponent implements OnInit {
  private _activatedRoute = inject(ActivatedRoute)
  private _authService = inject(AuthService)
  private _formBuilder = inject(UntypedFormBuilder)
  private _router = inject(Router)
  private _termsOfServiceService = inject(TermsService)

  @ViewChild('signInNgForm') signInNgForm: NgForm

  alert: { type: AlertType; message: string } = {
    type: 'success',
    message: '',
  }
  signInForm: UntypedFormGroup
  showAlert = false

  ngOnInit(): void {
    // Create the form
    this.signInForm = this._formBuilder.group({
      email: ['alex.swindler@nrel.gov', [Validators.required, Validators.email]],
      password: ['admin', Validators.required],
      terms: [false, Validators.requiredTrue],
    })
  }

  showTermsOfService(): void {
    this._termsOfServiceService.showTermsOfService()
  }

  get isTermsInvalid() {
    return this.signInForm.get('terms')?.invalid && this.signInForm.get('terms')?.touched
  }

  signIn(): void {
    this.signInForm.markAllAsTouched()

    // Return if the form is invalid
    if (this.signInForm.invalid) {
      return
    }

    // Disable the form
    this.signInForm.disable()

    // Hide the alert
    this.showAlert = false

    // Sign in
    this._authService.signIn(this.signInForm.value).subscribe({
      next: () => {
        // Set the redirect url.
        // The '/signed-in-redirect' is a dummy url to catch the request and redirect the user
        // to the correct page after a successful sign in. This way, that url can be set via
        // routing file and we don't have to touch here.
        const redirectURL = this._activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/signed-in-redirect'

        // Navigate to the redirect url
        void this._router.navigateByUrl(redirectURL)
      },
      error: (/* response */) => {
        // Re-enable the form
        this.signInForm.enable()

        this.signInNgForm.resetForm()

        // Set the alert
        this.alert = {
          type: 'error',
          message: 'Incorrect email or password',
        }
        this.showAlert = true
      },
    })
  }
}
