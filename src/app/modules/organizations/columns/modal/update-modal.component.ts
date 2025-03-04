import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { Subject, takeUntil } from 'rxjs'
import { AlertComponent } from '@seed/components'
import { UploaderService } from '@seed/services/uploader/uploader.service'
import type { ProgressBarObj, UploaderResponse } from '@seed/services/uploader/uploader.types'
import { SnackbarService } from 'app/core/snackbar/snackbar.service'

@Component({
  selector: 'seed-columns-update-modal',
  templateUrl: './update-modal.component.html',
  imports: [AlertComponent, CommonModule, MatButtonModule, MatDialogModule, MatProgressBarModule],
})
export class UpdateModalComponent implements OnDestroy, OnInit {
  private _uploaderService = inject(UploaderService)
  private _dialogRef = inject(MatDialogRef<UpdateModalComponent>)
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

  data = inject(MAT_DIALOG_DATA) as { progressResponse: UploaderResponse }

  ngOnInit(): void {
    this.inProgress = true
    const successFn = () => {
      setTimeout(() => {
        this._snackBar.success('Columns Updated')
        this.close()
      }, 300)
    }
    const failureFn = () => {
      this._snackBar.alert('Failed to update columns')
      this.close()
    }

    this._uploaderService.checkProgressLoop({
      progressKey: this.data.progressResponse.progress_key,
      offset: 0,
      multiplier: 1,
      successFn,
      failureFn,
      progressBarObj: this.progressBarObj,
    }).pipe(takeUntil(this._unsubscribeAll$)).subscribe()
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
