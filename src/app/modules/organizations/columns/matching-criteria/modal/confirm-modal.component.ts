import type { OnDestroy } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { Subject, switchMap, takeUntil, tap } from 'rxjs'
import { type Column, ColumnService } from '@seed/api/column'
import { type ProgressResponse } from '@seed/api/progress'
import { AlertComponent } from '@seed/components'
import { type ProgressBarObj, UploaderService } from '@seed/services/uploader'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'

@Component({
  selector: 'seed-columns-matching-criteria-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  imports: [AlertComponent, MatButtonModule, MatDialogModule, MatProgressBarModule],
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
        this.close()
      }, 300)
    }
    const failureFn = () => {
      this._snackBar.alert('Failed to change criteria')
      this.close()
    }
    const changes = {}
    this.inProgress = true
    for (const c of this.data.columns) {
      changes[`${c.id}`] = { is_matching_criteria: !c.is_matching_criteria }
    }
    this._columnService
      .updateMultipleColumns(this.data.orgId, this.data.columns[0].table_name, changes)
      .pipe(
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
