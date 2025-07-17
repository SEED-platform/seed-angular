import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { map } from 'rxjs'
import { type ColumnMapping, type ColumnMappingProfile, ColumnMappingProfileService } from '@seed/api/column-mapping-profile'

@Component({
  selector: 'seed-column-mappings-copy-modal',
  templateUrl: './copy-modal.component.html',
  imports: [MatButtonModule, MatDialogModule, MatDividerModule, MatFormFieldModule, MatIconModule, MatInputModule, ReactiveFormsModule],
})
export class CopyModalComponent implements OnInit {
  private _columnMappingProfileService = inject(ColumnMappingProfileService)
  private _dialogRef = inject(MatDialogRef<CopyModalComponent>)
  errorMessage: string
  inProgress = false
  profile: ColumnMappingProfile
  form = new FormGroup({
    name: new FormControl<string>('', [Validators.required]),
  })
  data = inject(MAT_DIALOG_DATA) as { selectedProfileName: string; mappings: ColumnMapping[]; org_id: number; profile_type: string }

  ngOnInit(): void {
    this.profile = { profile_type: this.data.profile_type, name: '', id: null, mappings: [] }
    this.profile.mappings = this.data.mappings
  }

  onSubmit() {
    this.profile.name = this.form.get('name').value
    this._columnMappingProfileService
      .create(this.data.org_id, this.profile)
      .pipe(
        map((response) => {
          this._dialogRef.close(response.data.id)
        }),
      )
      .subscribe()
  }

  close() {
    this._dialogRef.close()
  }
}
