import { CommonModule } from '@angular/common'
import type { OnDestroy } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { Subject, switchMap, takeUntil, tap } from 'rxjs'
import { type Column, ColumnService } from '@seed/api/column'
import type { ProgressResponse } from '@seed/api/progress'
import { AlertComponent } from '@seed/components'
import { UploaderService } from '@seed/services/uploader/uploader.service'
import type { ProgressBarObj } from '@seed/services/uploader/uploader.types'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'

@Component({
  selector: 'seed-cycles-delete-modal',
  templateUrl: './delete-modal.component.html',
  imports: [AlertComponent, CommonModule, MatButtonModule, MatDialogModule, MatDividerModule, MatIconModule, MatProgressBarModule],
})
export class DeleteModalComponent implements OnDestroy {
  private _columnService = inject(ColumnService)
  private _uploaderService = inject(UploaderService)
  private _dialogRef = inject(MatDialogRef<DeleteModalComponent>)
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

  data = inject(MAT_DIALOG_DATA) as { column: Column }

  onSubmit() {
    this.inProgress = true
    const successFn = () => {
      setTimeout(() => {
        this._snackBar.success('Column deleted')
        this.close()
      }, 300)
    }
    const failureFn = () => {
      this._snackBar.alert('Failed to delete column')
      this.close()
    }

    // initiate delete cycle task
    this._columnService
      .deleteColumn(this.data.column)
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap((response: ProgressResponse) => {
          this.progressBarObj.progress = response.progress
        }),
        switchMap(({ progress_key }) => {
          return this._uploaderService.checkProgressLoop({
            progressKey: progress_key,
            successFn,
            failureFn,
            progressBarObj: this.progressBarObj,
          })
        }),
      )
      .subscribe()
  }

  close() {
    this._dialogRef.close()
  }

  dismiss() {
    this._dialogRef.close()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
