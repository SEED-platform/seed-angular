import { CommonModule } from '@angular/common'
import type { OnDestroy } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { Subject, takeUntil, tap } from 'rxjs'
import type { DerivedColumn } from '@seed/api/derived-column'
import { DerivedColumnService } from '@seed/api/derived-column'
import { AlertComponent } from '@seed/components'
import { SnackbarService } from 'app/core/snackbar/snackbar.service'

@Component({
  selector: 'seed-derived-column-delete-modal',
  templateUrl: './delete-modal.component.html',
  imports: [
    AlertComponent,
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressBarModule,
  ],
})
export class DeleteModalComponent implements OnDestroy {
  private _derivedColumnService = inject(DerivedColumnService)
  private _dialogRef = inject(MatDialogRef<DeleteModalComponent>)
  private _snackBar = inject(SnackbarService)
  private readonly _unsubscribeAll$ = new Subject<void>()

  errorMessage: string

  data = inject(MAT_DIALOG_DATA) as { derivedColumn: DerivedColumn; orgId: number }

  onSubmit() {
    this._derivedColumnService.delete(this.data.derivedColumn.id, this.data.orgId)
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => { this._dialogRef.close() }),
      ).subscribe()
  }

  dismiss() {
    this._dialogRef.close()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
