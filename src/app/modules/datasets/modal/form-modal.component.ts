import { CommonModule } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import type { Dataset } from '@seed/api/dataset'
import { DatasetService } from '@seed/api/dataset'
import { ModalHeaderComponent } from '@seed/components'
import { SEEDValidators } from '@seed/validators'

@Component({
  selector: 'seed-dataset-form-modal',
  templateUrl: './form-modal.component.html',
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ModalHeaderComponent,
    ReactiveFormsModule,
  ],
})
export class FormModalComponent implements OnInit {
  private _dialogRef = inject(MatDialogRef<FormModalComponent>)
  private _datasetService = inject(DatasetService)
  data = inject(MAT_DIALOG_DATA) as { orgId: number; dataset: Dataset; existingNames?: string[] }
  form = new FormGroup({
    name: new FormControl<string>('', [Validators.required, SEEDValidators.uniqueValue(this.data.existingNames)]),
  })
  create = this.data.dataset ? false : true

  ngOnInit() {
    if (this.data.dataset) {
      this.form.patchValue({ name: this.data.dataset.name })
    }
  }

  onSubmit() {
    if (!this.form.valid) return

    if (this.create) {
      this._datasetService.create(this.data.orgId, this.form.value.name).subscribe(() => {
        this.dismiss()
      })
    } else {
      this._datasetService.update(this.data.orgId, this.data.dataset.id, this.form.value.name).subscribe(() => {
        this.dismiss()
      })
    }
  }

  dismiss() {
    this._dialogRef.close()
  }
}
