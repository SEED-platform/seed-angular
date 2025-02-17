import { CommonModule, DatePipe } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DATE_FORMATS, MatNativeDateModule } from '@angular/material/core'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { Subject, takeUntil, tap } from 'rxjs'
import type { Cycle } from '@seed/api/cycle'
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
export class FormModalComponent implements OnDestroy, OnInit {
  private _cycleService = inject(CycleService)
  private _datePipe = inject(DatePipe)
  private _dialogRef = inject(MatDialogRef<FormModalComponent>)
  private readonly _unsubscribeAll$ = new Subject<void>()

  create = true
  data = inject(MAT_DIALOG_DATA) as { cycle: Cycle | null; orgId: number; existingNames: string[] }
  form = new FormGroup({
    name: new FormControl<string | null>('', [
      Validators.required,
      SEEDValidators.uniqueValue(this.data.existingNames.filter((name) => name !== this.data.cycle?.name)),
    ]),
    start: new FormControl<string | null>(null, Validators.required),
    end: new FormControl<string | null>(null, [Validators.required, SEEDValidators.afterDate('start')]),
  })

  ngOnInit(): void {
    if (this.data.cycle) {
      this.create = false
      this.form.patchValue(this.data.cycle)
    }
    this.form.get('start')?.valueChanges
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => { this.form.get('end')?.updateValueAndValidity() }),
      ).subscribe()
  }

  onSubmit() {
    this._formatDates()
    const fn = this.create
      ? this._cycleService.post({ data: this.form.value as Cycle, orgId: this.data.orgId })
      : this._cycleService.put({ data: this.form.value as Cycle, id: this.data.cycle.id, orgId: this.data.orgId })

    fn.subscribe(() => {
      this.close()
    })
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

  private _formatDates() {
    this.form.value.start = this._datePipe.transform(this.form.value.start, 'yyyy-MM-dd')
    this.form.value.end = this._datePipe.transform(this.form.value.end, 'yyyy-MM-dd')
  }
}
