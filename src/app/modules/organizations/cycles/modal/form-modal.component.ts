import { CommonModule, DatePipe } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DATE_FORMATS, MatNativeDateModule } from '@angular/material/core'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSnackBar } from '@angular/material/snack-bar'
import type { Cycle, CycleResponse } from '@seed/api/cycle'
import { CycleService } from '@seed/api/cycle/cycle.service'
import { SEEDValidators } from '@seed/validators'

// configure the datepicker to display 01/01/2000 instead of January 1, 2000
export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'MM/dd/yyyy',
  },
  display: {
    dateInput: 'MM/dd/yyyy',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'MM/dd/yyyy',
    monthYearA11yLabel: 'MMMM yyyy',
  },
}

@Component({
  selector: 'seed-cycles-form-modal',
  templateUrl: './form-modal.component.html',
  providers: [DatePipe, { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }],
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
export class FormModalComponent implements OnInit {
  private _cycleService = inject(CycleService)
  private _snackBar = inject(MatSnackBar)
  private _datePipe = inject(DatePipe)
  private _dialogRef = inject(MatDialogRef<FormModalComponent>)

  create = true
  data = inject(MAT_DIALOG_DATA) as { cycle: Cycle | null; orgId: number; existingNames: string[] }
  form = new FormGroup({
    name: new FormControl<string | null>(
      '',
      [Validators.required, SEEDValidators.uniqueValue(this.data.existingNames.filter((name) => name !== this.data.cycle?.name))]),
    start: new FormControl<string | null>(null, Validators.required),
    end: new FormControl<string | null>(
      null,
      [Validators.required, SEEDValidators.afterDate('start')],
    ),
  })

  ngOnInit(): void {
    if (this.data.cycle) {
      this.create = false
      this.form.patchValue(this.data.cycle)
    }
    this.form.get('start')?.valueChanges.subscribe(() => {
      this.form.get('end')?.updateValueAndValidity()
    })
  }

  onSubmit() {
    this._formatDates()
    const fn = this.create
      ? this._cycleService.post({ data: this.form.value as Cycle, orgId: this.data.orgId })
      : this._cycleService.put({ data: this.form.value as Cycle, id: this.data.cycle.id, orgId: this.data.orgId })

    fn.subscribe((response) => {
      this.close(response)
    })
  }

  close(response: CycleResponse) {
    const message = this.create ? `Created Cycle ${response.cycles.name}` : `Updated Cycle ${response.cycles.name}`
    if (response.status === 'success') {
      this.openSnackBar(message)
    }
    this._dialogRef.close(response)
  }

  dismiss() {
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
