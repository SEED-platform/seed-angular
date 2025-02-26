import { CommonModule } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { type Label, LabelService } from '@seed/api/label'
import { LabelComponent } from '@seed/components'

@Component({
  selector: 'seed-labels-delete-modal',
  templateUrl: './delete-modal.component.html',
  imports: [
    CommonModule,
    LabelComponent,
    MatButtonModule,
    MatDialogModule,
  ],
})
export class DeleteModalComponent implements OnInit {
  private _labelService = inject(LabelService)
  private _dialogRef = inject(MatDialogRef<DeleteModalComponent>)

  create = true
  data = inject(MAT_DIALOG_DATA) as { label: Label | null }
  label: Label

  ngOnInit(): void {
    this.label = this.data.label
  }

  onSubmit() {
    this._labelService.delete(this.label).subscribe()
    this.close()
  }

  close() {
    this._dialogRef.close()
  }
}
