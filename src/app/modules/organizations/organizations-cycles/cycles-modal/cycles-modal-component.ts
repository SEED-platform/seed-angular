import { CommonModule, DatePipe } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatNativeDateModule } from '@angular/material/core'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSnackBar } from '@angular/material/snack-bar'
import type { Cycle, CyclesResponse } from '@seed/api/cycle'
import { CycleService } from '@seed/api/cycle/cycle.service'

@Component({
  selector: 'seed-cycles-modal',
  templateUrl: './cycles-modal-component.html',
  providers: [DatePipe],
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    FormsModule,
    MatInputModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    MatNativeDateModule,
  ],
})
export class CyclesModalComponent implements OnInit {
  private _cycleService = inject(CycleService)
  private _snackBar = inject(MatSnackBar)
  private _datePipe = inject(DatePipe)
  private _dialogRef = inject(MatDialogRef<CyclesModalComponent>)

  create = true
  form = new FormGroup({
    name: new FormControl<string | null>('', Validators.required),
    start: new FormControl<string | null>(null, Validators.required),
    end: new FormControl<string | null>(null, Validators.required),
  })
  data = inject(MAT_DIALOG_DATA) as { cycle: Cycle | null; orgId: number }

  ngOnInit(): void {
    if (this.data.cycle) this.create = false
    console.log('data', this.data)
  }

  onSubmit() {
    if (this.create) {
      this._formatDates()
      this._cycleService.post(this.form.value as Cycle, this.data.orgId)
        .subscribe((response) => {
          this.close(response)
        })
    }
  }

  close(response: CyclesResponse) {
    if (response.status === 'success') {
      this.openSnackBar(`Created Cycle ${response.cycles[0]?.name}`)
    }
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

  private _formatDates() {
    this.form.value.start = this._datePipe.transform(this.form.value.start, 'yyyy-MM-dd')
    this.form.value.end = this._datePipe.transform(this.form.value.end, 'yyyy-MM-dd')
  }
}
