import { CommonModule } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import type { Dataset } from '@seed/api/dataset'
import { PropertyTaxlotUploadComponent } from './property-taxlot-upload.component'
import { Cycle } from '@seed/api/cycle'

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
export class UploadFileModalComponent implements OnInit {
  private _dialogRef = inject(MatDialogRef<UploadFileModalComponent>)

  data = inject(MAT_DIALOG_DATA) as { orgId: number; dataset: Dataset; cycles: Cycle[] }

  ngOnInit() {
    return
  }

  onSubmit() {
    return
  }

  dismiss() {
    this._dialogRef.close()
  }
}
