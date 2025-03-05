import type { OnDestroy } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { Subject, takeUntil, tap } from 'rxjs'
import type { OrganizationUser } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import { AlertComponent } from '@seed/components'

@Component({
  selector: 'seed-member-delete-modal',
  templateUrl: './delete-modal.component.html',
  imports: [AlertComponent, MatButtonModule, MatDialogModule],
})
export class DeleteModalComponent implements OnDestroy {
  private _organizationService = inject(OrganizationService)
  private _dialogRef = inject(MatDialogRef<DeleteModalComponent>)
  private readonly _unsubscribeAll$ = new Subject<void>()
  errorMessage: string

  data = inject(MAT_DIALOG_DATA) as { member: OrganizationUser; orgId: number }

  onSubmit() {
    this._organizationService
      .deleteOrganizationUser(this.data.member.user_id, this.data.orgId)
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => {
          this.close('success')
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
