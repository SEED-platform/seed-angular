import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { type ColumnMappingProfile, ColumnMappingProfileService } from '@seed/api/column_mapping_profile'
import { AlertComponent } from '@seed/components'

@Component({
  selector: 'seed-column-mappings-delete-modal',
  templateUrl: './delete-modal.component.html',
  imports: [AlertComponent, MatButtonModule, MatDialogModule, MatProgressBarModule],
})
export class DeleteModalComponent implements OnInit {
  private _columnMappingProfileService = inject(ColumnMappingProfileService)
  private _dialogRef = inject(MatDialogRef<DeleteModalComponent>)
  errorMessage: string
  inProgress = false
  profile: ColumnMappingProfile

  data = inject(MAT_DIALOG_DATA) as { profile: ColumnMappingProfile; org_id: number }

  ngOnInit(): void {
    this.profile = this.data.profile
  }

  onSubmit() {
    this._columnMappingProfileService.delete(this.data.org_id, this.profile.id).subscribe()
    this.close()
  }

  close() {
    this._dialogRef.close()
  }
}
