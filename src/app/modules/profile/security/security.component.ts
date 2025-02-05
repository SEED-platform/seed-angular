import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, signal} from '@angular/core'
import type { AbstractControl, ValidationErrors } from '@angular/forms'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { Subject, takeUntil } from 'rxjs'
import type { CurrentUser, PasswordUpdateRequest } from '@seed/api/user'
import { UserService } from '@seed/api/user'
import type { Alert } from '@seed/components'
import { AlertComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
@Component({
  selector: 'seed-profile-security',
  templateUrl: './security.component.html',
  imports: [
    AlertComponent,
    MatIconModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    SharedImports,
  ],
})
export class ProfileSecurityComponent implements OnInit, OnDestroy {
  private _userService = inject(UserService)

  alert: Alert
  showAlert = false
  user: CurrentUser

  // password rules:  8 characters, 1 Uppercase, 1 Lowercase, 1 Number
  pwdPattern = '^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z]).{8,}$'

  passwordForm = new FormGroup(
    {
      currentPassword: new FormControl('', [Validators.required]),
      newPassword: new FormControl('', [Validators.required, Validators.pattern(this.pwdPattern)]),
      confirmNewPassword: new FormControl('', [Validators.required, this.validateSamePassword]),
    },
  )

  hide = signal(true)

  private readonly _unsubscribeAll$ = new Subject<void>()

  validateSamePassword(control: AbstractControl): ValidationErrors | null {
    const password = control.parent?.get('newPassword')
    const confirmPassword = control.parent?.get('confirmNewPassword')
    return password?.value == confirmPassword?.value ? null : { notSame: true }
  }



  ngOnInit(): void {
    // Subscribe to user changes
    this._userService.currentUser$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((currentUser) => {
      this.user = currentUser
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  onSubmit() {
    // Handle form submission
    if (this.passwordForm.valid) {
      const passwordData = {
        current_password: this.passwordForm.value.currentPassword,
        password_1: this.passwordForm.value.newPassword,
        password_2: this.passwordForm.value.confirmNewPassword,
      } as PasswordUpdateRequest

      this._userService.updatePassword(passwordData).subscribe({
        error: (error: { error?: { message?: string } }) => {
          const error_msg = error.error?.message || 'An unknown error occurred.'
          this.alert = {
            type: 'error',
            message: `Error Updating Password: ${error_msg}`,
          }
          this.showAlert = true
        },
        complete: () => {
          this.alert = {
            type: 'success',
            message: 'Changes saved!',
          }
          this.showAlert = true
        },
      })
    }
  }

  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide())
    event.stopPropagation()
  }
}
