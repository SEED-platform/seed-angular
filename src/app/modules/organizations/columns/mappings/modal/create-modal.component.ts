import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { map } from 'rxjs'
import { type ColumnMapping, type ColumnMappingProfile, ColumnMappingProfileService } from '@seed/api/column_mapping_profile'

@Component({
  selector: 'seed-column-mappings-create-modal',
  templateUrl: './create-modal.component.html',
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
})
export class CreateModalComponent implements OnInit {
  private _columnMappingProfileService = inject(ColumnMappingProfileService)
  private _dialogRef = inject(MatDialogRef<CreateModalComponent>)
  errorMessage: string
  inProgress = false
  profile: ColumnMappingProfile
  form = new FormGroup({
    name: new FormControl<string>('', [Validators.required]),
  })
  data = inject(MAT_DIALOG_DATA) as { mappings: ColumnMapping[]; org_id: number }

  ngOnInit(): void {
    this.profile = { profile_type: 'Normal', name: '', id: null, mappings: [] }
    this.profile.mappings = this.data.mappings
  }

  onSubmit() {
    console.log('Creating: ', this.profile)
    this.profile.name = this.form.get('name').value
    this._columnMappingProfileService.create(this.data.org_id, this.profile).pipe(
      map((response) => {
        this._dialogRef.close(response.data.id)
      }),
    ).subscribe()
  }

  close() {
    this._dialogRef.close()
  }
}
