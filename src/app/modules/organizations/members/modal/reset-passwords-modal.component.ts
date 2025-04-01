import type { OnDestroy } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { Subject, takeUntil, tap } from 'rxjs'
import { OrganizationService } from '@seed/api/organization'
import { AuthService } from 'app/core/auth'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'

@Component({
  selector: 'seed-member-reset-passwords-modal',
  templateUrl: './reset-passwords-modal.component.html',
  imports: [MatButtonModule, MatDialogModule],
})
export class ResetPasswordsModalComponent implements OnDestroy {
  private _organizationService = inject(OrganizationService)
  private _dialogRef = inject(MatDialogRef<ResetPasswordsModalComponent>)
  private _snackBar = inject(SnackBarService)
  private _authService = inject(AuthService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  errorMessage: string

  data = inject(MAT_DIALOG_DATA) as { orgId: number }

  onSubmit() {
    this._organizationService
      .resetPasswords(this.data.orgId)
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => {
          this._snackBar.warning('All passwords have been reset.')
          this.close('success')
          this._authService.signOut()
        }),
      )
      .subscribe()
  }

  close(message: string) {
    this._dialogRef.close(message)
  }

  dismiss() {
    this._dialogRef.close()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
