import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import type { Cycle } from '@seed/api/cycle'
import type { Dataset } from '@seed/api/dataset'
import { PropertyTaxlotUploadComponent } from './property-taxlot-upload.component'

@Component({
  selector: 'seed-data-upload-modal',
  templateUrl: './data-upload-modal.component.html',
  imports: [
    CommonModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    PropertyTaxlotUploadComponent,
  ],
})
export class UploadFileModalComponent {
  private _dialogRef = inject(MatDialogRef<UploadFileModalComponent>)

  data = inject(MAT_DIALOG_DATA) as { orgId: number; dataset: Dataset; cycles: Cycle[] }

  dismiss() {
    this._dialogRef.close()
  }
}
