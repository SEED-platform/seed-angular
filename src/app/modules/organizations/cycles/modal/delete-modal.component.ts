import type { OnDestroy } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { Subject, switchMap, takeUntil, tap } from 'rxjs'
import type { Cycle } from '@seed/api/cycle'
import { CycleService } from '@seed/api/cycle/cycle.service'
import { AlertComponent } from '@seed/components'
import { UploaderService } from '@seed/services/uploader/uploader.service'
import type { ProgressBarObj } from '@seed/services/uploader/uploader.types'
import { SnackbarService } from 'app/core/snackbar/snackbar.service'

@Component({
  selector: 'seed-cycles-delete-modal',
  templateUrl: './delete-modal.component.html',
  imports: [AlertComponent, MatButtonModule, MatDialogModule, MatProgressBarModule],
})
export class DeleteModalComponent implements OnDestroy {
  private _cycleService = inject(CycleService)
  private _uploaderService = inject(UploaderService)
  private _dialogRef = inject(MatDialogRef<DeleteModalComponent>)
  private _snackBar = inject(SnackbarService)
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

  data = inject(MAT_DIALOG_DATA) as { cycle: Cycle; orgId: number }

  onSubmit() {
    this.inProgress = true
    const successFn = () => {
      setTimeout(() => {
        this._snackBar.success('Cycle deleted')
        this.close()
      }, 300)
    }
    const failureFn = () => {
      this._snackBar.alert('Failed to delete cycle')
      this.close()
    }

    // initiate delete cycle task
    this._cycleService
      .delete(this.data.cycle.id, this.data.orgId)
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap((response: { progress_key: string; value: number }) => {
          this.progressBarObj.progress = response.value
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
