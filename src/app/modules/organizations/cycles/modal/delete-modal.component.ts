import { CommonModule, DatePipe } from '@angular/common'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatNativeDateModule } from '@angular/material/core'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSnackBar } from '@angular/material/snack-bar'
import type { Cycle } from '@seed/api/cycle'
import { CycleService } from '@seed/api/cycle/cycle.service'

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
  ],
})
export class DeleteModalComponent {
  private _cycleService = inject(CycleService)
  private _snackBar = inject(MatSnackBar)
  private _dialogRef = inject(MatDialogRef<DeleteModalComponent>)

  data = inject(MAT_DIALOG_DATA) as { cycle: Cycle; orgId: number }

  onSubmit() {
    this._cycleService.delete(this.data.cycle.id, this.data.orgId)
      .subscribe((response) => {
        this.close(response)
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
