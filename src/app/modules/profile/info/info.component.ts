import type { OnDestroy, OnInit } from '@angular/core'
import { ChangeDetectorRef, Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { Subject, takeUntil } from 'rxjs'
import type { CurrentUser, UserUpdateRequest } from '@seed/api/user'
import { UserService } from '@seed/api/user'
import type { Alert } from '@seed/components'
import { AlertComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
@Component({
  selector: 'seed-profile-info',
  templateUrl: './info.component.html',
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
export class ProfileInfoComponent implements OnInit, OnDestroy {
  private _userService = inject(UserService)
  private _changeDetectorRef = inject(ChangeDetectorRef)

  alert: Alert
  showAlert = false
  user: CurrentUser

  profileForm = new FormGroup({
    firstName: new FormControl('', [Validators.required]),
    lastName: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
  })

  private readonly _unsubscribeAll$ = new Subject<void>()

  ngOnInit(): void {
    // Subscribe to user changes
    this._userService.currentUser$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((currentUser) => {
      this.user = currentUser

      // pre-populate form (here?)
      if (this.user.first_name) this.profileForm.get('firstName')?.setValue(this.user.first_name)
      if (this.user.last_name) this.profileForm.get('lastName')?.setValue(this.user.last_name)
      if (this.user.email) this.profileForm.get('email')?.setValue(this.user.email)

      // Mark for check
      this._changeDetectorRef.markForCheck()
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  onSubmit(): void {
    // Handle form submission
    if (this.profileForm.valid) {
      const userData = {
        first_name: this.profileForm.value.firstName,
        last_name: this.profileForm.value.lastName,
        email: this.profileForm.value.email,
      } as UserUpdateRequest

      this._userService.updateUser(this.user.id, userData).subscribe({
        error: (error) => {
          console.error('Error:', error)
          this.alert = {
            type: 'error',
            message: 'Update User Unsuccessful...',
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
}
