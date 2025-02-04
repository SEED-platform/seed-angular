import type { OnDestroy, OnInit } from '@angular/core'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, ViewEncapsulation } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { Subject, takeUntil } from 'rxjs'
import type { CurrentUser } from '@seed/api/user'
import { UserService } from '@seed/api/user'
import type { Alert } from '@seed/components'
import { AlertComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
@Component({
  selector: 'seed-profile-developer',
  templateUrl: './developer.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AlertComponent, FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, ReactiveFormsModule, SharedImports],
})
export class ProfileDeveloperComponent implements OnInit, OnDestroy {
  private _userService = inject(UserService)
  private _changeDetectorRef = inject(ChangeDetectorRef)

  alert: Alert
  showAlert = false
  user: CurrentUser

  private readonly _unsubscribeAll$ = new Subject<void>()

  ngOnInit(): void {
    // Subscribe to user changes
    this._userService.currentUser$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((currentUser) => {
      this.user = currentUser

      // Mark for check
      this._changeDetectorRef.markForCheck()
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  generateKey(): void {
    // send request to generate a new key; refresh user
    this._userService.generateApiKey().subscribe({
      error: (error) => {
        console.error('Error:', error)
        this.alert = {
          type: 'error',
          message: 'Generate New Key Unsuccessful...',
        }
        this.showAlert = true
      },
      complete: () => {
        this.alert = {
          type: 'success',
          message: 'New API Key Generated!',
        }
        this.showAlert = true
      },
    })
  }
}
