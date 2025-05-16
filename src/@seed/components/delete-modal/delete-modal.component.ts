import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'

@Component({
  selector: 'seed-delete-modal',
  templateUrl: './delete-modal.component.html',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
  ],
})
export class DeleteModalComponent {
  private _dialogRef = inject(MatDialogRef<DeleteModalComponent>)
  data = inject(MAT_DIALOG_DATA) as { instance: string; model: string }

  onSubmit() {
    this.close('delete')
  }

  close(message = '') {
    this._dialogRef.close(message)
  }
}
