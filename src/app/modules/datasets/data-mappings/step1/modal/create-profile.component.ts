import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import type { ColumnMappingProfile, ColumnMappingProfileType } from '@seed/api/column_mapping_profile'
import { ColumnMappingProfileService } from '@seed/api/column_mapping_profile'
import { SEEDValidators } from '@seed/validators'

@Component({
  selector: 'seed-data-mapping-create-profile',
  templateUrl: './create-profile.component.html',
  imports: [
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    ReactiveFormsModule,
  ],
})
export class CreateProfileComponent {
  private _columnMappingProfileService = inject(ColumnMappingProfileService)
  private _dialogRef = inject(MatDialogRef<CreateProfileComponent>)

  profileName = ''
  profile: ColumnMappingProfile

  data = inject(MAT_DIALOG_DATA) as { orgId: number; profileType: ColumnMappingProfileType; existingNames: string[] }
  form = new FormGroup({
    name: new FormControl<string>('', [Validators.required, SEEDValidators.uniqueValue(this.data.existingNames)]),
  })

  onSubmit() {
    this.profile = {
      name: this.form.value.name,
      profile_type: this.data.profileType,
      mappings: [],
    } as ColumnMappingProfile

    this._columnMappingProfileService.create(this.data.orgId, this.profile)
      .subscribe(() => {
        this.close()
      })
  }

  close() {
    this._dialogRef.close()
  }
}
