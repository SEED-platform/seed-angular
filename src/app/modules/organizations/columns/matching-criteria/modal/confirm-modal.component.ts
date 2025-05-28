import { CommonModule } from '@angular/common'
import type { OnDestroy } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { type Column, ColumnService } from '@seed/api/column'
import { type ProgressResponse } from '@seed/api/progress'
import { AlertComponent } from '@seed/components'
import { type ProgressBarObj, UploaderService } from '@seed/services/uploader'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import { catchError, EMPTY, Subject, switchMap, takeUntil, tap } from 'rxjs'

@Component({
  selector: 'seed-columns-matching-criteria-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  imports: [
    AlertComponent,
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    MatProgressBarModule,
  ],
})
export class ConfirmModalComponent implements OnDestroy {
  private _columnService = inject(ColumnService)
  private _uploaderService = inject(UploaderService)
  private _dialogRef = inject(MatDialogRef<ConfirmModalComponent>)
  private _snackBar = inject(SnackBarService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  errorMessage: string
  inProgress = false
  progressBarObj: ProgressBarObj = {
    message: '',
    progress: 0,
    complete: false,
    statusMessage: '',
    progressLastUpdated: null,
    progressLastChecked: null,
  }

  data = inject(MAT_DIALOG_DATA) as { columns: Column[]; orgId: number }

  onSubmit() {
    this.inProgress = true

    const successFn = () => {
      setTimeout(() => {
        this._snackBar.success('Criteria Updated')
        this.close(true)
      }, 300)
    }

    const failureFn = () => {
      this._snackBar.alert('Failed to change criteria')
      this.dismiss()
    }

    const changes = {}
    this.inProgress = true
    for (const c of this.data.columns) {
      changes[`${c.id}`] = { is_matching_criteria: !c.is_matching_criteria }
    }
    this.progressBarObj.message = 'Updating matching criteria...'

    this._columnService.updateMultipleColumns(this.data.orgId, this.data.columns[0].table_name, changes).pipe(
      takeUntil(this._unsubscribeAll$),
      tap((response: ProgressResponse) => {
        this.progressBarObj.progress = response.progress
      }),
      switchMap(({ progress_key }) => {
        return this._uploaderService.checkProgressLoop({
          progressKey: progress_key,
          offset: 0,
          multiplier: 1,
          successFn,
          failureFn,
          progressBarObj: this.progressBarObj,
        })
      }),
      catchError(() => {
        this.inProgress = false
        this.errorMessage = 'An error occurred while updating matching criteria.'
        return EMPTY
      }),
    ).subscribe()
  }

  close(success) {
    this._dialogRef.close(success)
  }

  dismiss() {
    this._dialogRef.close()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
