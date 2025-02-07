import { CommonModule, DatePipe } from '@angular/common'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatNativeDateModule } from '@angular/material/core'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatSnackBar } from '@angular/material/snack-bar'
import type { Cycle } from '@seed/api/cycle'
import { CycleService } from '@seed/api/cycle/cycle.service'
import { UploaderService } from '@seed/services/uploader/uploader.service'

@Component({
  selector: 'seed-cycles-delete-modal',
  templateUrl: './delete-modal.component.html',
  providers: [DatePipe],
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
  ],
})
export class DeleteModalComponent {
  private _cycleService = inject(CycleService)
  private _uploaderService = inject(UploaderService)
  private _snackBar = inject(MatSnackBar)
  private _dialogRef = inject(MatDialogRef<DeleteModalComponent>)
  inProgress = true
  progressBarObj = {
    in_progress: false,
    message: '',
    progress: 0,
    complete: false,
    status_message: '',
    progress_last_updated: null,
    progress_last_checked: null,
  }

  data = inject(MAT_DIALOG_DATA) as { cycle: Cycle; orgId: number }

  onSubmit() {
    this.inProgress = true
    this._cycleService.delete(this.data.cycle.id, this.data.orgId)
      .subscribe({
        next: (response: { progress_key: string; value: number; total: number }) => {
          this.progressBarObj.progress = response.value
          const successFn = () => {
            console.log('success')
          }
          const errorFn = () => {
            console.log('error')
          }
          this._uploaderService.checkProgressLoop({
            progressKey: response.progress_key,
            offset: 0,
            multiplier: 1,
            successFn,
            errorFn,
            progressBarObj: this.progressBarObj,
          })
          this.close(response)
        },
        error: (error) => {
          console.log(error)
        },
      })
  }

  close(response: unknown) {
    this.openSnackBar(`Deleted Cycle ${this.data.cycle.name}`)
    this._dialogRef.close(response)
  }

  dismiss() {
    this.openSnackBar('Dismissed')
    this._dialogRef.close('dismiss')
  }

  openSnackBar(message: string) {
    this._snackBar.open(message, null, {
      verticalPosition: 'top',
      duration: 2000,
    })
  }
}
