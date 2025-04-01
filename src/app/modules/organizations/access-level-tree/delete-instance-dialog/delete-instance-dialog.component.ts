import { CommonModule } from '@angular/common'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { finalize } from 'rxjs'
import { OrganizationService } from '@seed/api/organization'
import { SharedImports } from '@seed/directives'
import type { DeleteInstanceData } from '..'

@Component({
  selector: 'seed-delete-instance-dialog',
  templateUrl: './delete-instance-dialog.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule, SharedImports],
})
export class DeleteInstanceDialogComponent {
  private _data = inject(MAT_DIALOG_DATA) as DeleteInstanceData
  private _dialogRef = inject(MatDialogRef<DeleteInstanceDialogComponent>)
  private _organizationService = inject(OrganizationService)

  readonly instance = this._data.instance
  readonly warnings = this._data.warnings
  submitted = false

  delete() {
    if (!this.submitted) {
      this.submitted = true
      this._organizationService
        .deleteAccessLevelInstance(this._data.organizationId, this._data.instance.id)
        .pipe(
          finalize(() => {
            this._dialogRef.close()
          }),
        )
        .subscribe()
    } else {
      this._dialogRef.close()
    }
  }
}
