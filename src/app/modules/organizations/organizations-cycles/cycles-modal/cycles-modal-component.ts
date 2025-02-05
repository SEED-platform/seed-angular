import { Component, inject, OnInit } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { CommonModule, DatePipe } from '@angular/common'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { Cycle } from '@seed/api/cycle'
import { MatNativeDateModule } from '@angular/material/core'
import { CycleService } from '@seed/api/cycle/cycle.service'

@Component({
  selector: 'cycles-modal',
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
  private datePipe = inject(DatePipe);
  private dialogRef = inject(MatDialogRef<CyclesModalComponent>)

  create = true
  form = new FormGroup({
    name: new FormControl<string | null>('', Validators.required),
    start: new FormControl<string | null>(null, Validators.required),
    end: new FormControl<string | null>(null, Validators.required),
  })
  data = inject(MAT_DIALOG_DATA) as { cycle: Cycle | null, org_id: number }
  
  ngOnInit(): void {
    if (this.data.cycle) this.create = false
    console.log('data', this.data)
  }
  private _formatDates() {
    this.form.value.start = this.datePipe.transform(this.form.value.start, 'yyyy-MM-dd')
    this.form.value.end = this.datePipe.transform(this.form.value.end, 'yyyy-MM-dd')
  }

  onSubmit() {
    if (this.create) {
      this._formatDates()
      this._cycleService.post(this.form.value as Cycle, this.data.org_id)
    }

    this.dialogRef.close('submitted')
  }

  close() {
    this.dialogRef.close()
  }
}