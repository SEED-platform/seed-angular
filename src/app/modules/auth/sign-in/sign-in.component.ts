import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import type { FormGroup } from '@angular/forms'
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { Subject, takeUntil } from 'rxjs'
import { Animations } from '@seed/animations'
import { ConfigService } from '@seed/api/config'
import type { Alert } from '@seed/components'
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
export class AuthSignInComponent implements OnInit, OnDestroy {
  private _activatedRoute = inject(ActivatedRoute)
  private _authService = inject(AuthService)
  private _configService = inject(ConfigService)
  private _formBuilder = inject(FormBuilder)
  private _router = inject(Router)
  private _termsOfServiceService = inject(TermsService)

  private readonly _unsubscribeAll$ = new Subject<void>()

  alert: Alert
  allowSignUp = false
  showAlert = false
  signInForm: FormGroup

  ngOnInit(): void {
    this._configService.config$.pipe(takeUntil(this._unsubscribeAll$)).subscribe(({ allow_signup: allowSignUp }) => {
      this.allowSignUp = allowSignUp
    })

    this.signInForm = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      terms: [false, Validators.requiredTrue],
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
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
    const { email, password } = this.signInForm.value as { email: string; password: string; terms: boolean }
    this._authService.signIn({ username: email.toLowerCase(), password }).subscribe({
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

        this.signInForm.reset()

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
