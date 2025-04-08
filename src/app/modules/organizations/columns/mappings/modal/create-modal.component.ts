import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIcon } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { map } from 'rxjs'
import { type ColumnMapping, type ColumnMappingProfile, ColumnMappingProfileService } from '@seed/api/column_mapping_profile'

@Component({
  selector: 'seed-column-mappings-create-modal',
  templateUrl: './create-modal.component.html',
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, MatIcon, MatInputModule, ReactiveFormsModule],
})
export class CreateModalComponent implements OnInit {
  private _columnMappingProfileService = inject(ColumnMappingProfileService)
  private _dialogRef = inject(MatDialogRef<CreateModalComponent>)
  errorMessage: string
  inProgress = false
  profile: ColumnMappingProfile
  form = new FormGroup({
    name: new FormControl<string>('', [Validators.required]),
    mappings: new FormArray([new FormControl('', [Validators.required])]),
  })
  data = inject(MAT_DIALOG_DATA) as { org_id: number }

  ngOnInit(): void {
    this.profile = { profile_type: 'Normal', name: '', id: null, mappings: [] }
    this.profile.mappings = []
  }

  onSubmit() {
    this.profile.name = this.form.get('name').value
    for (const m of this.mappings.controls) {
      this.addToMapping(m.value as string)
    }
    this._columnMappingProfileService.create(this.data.org_id, this.profile).pipe(
      map((response) => {
        this._dialogRef.close(response.data.id)
      }),
    ).subscribe()
  }

  close() {
    this._dialogRef.close()
  }

  get mappings() {
    return this.form.get('mappings') as FormArray
  }

  addMapping() {
    this.mappings.push(new FormControl('', [Validators.required]))
    setTimeout(() => {
      document.getElementById('mappings').scroll(0, 100 * this.mappings.length)
    }, 25)
  }

  removeMapping(index: number) {
    this.mappings.removeAt(index)
  }

  addToMapping(field: string) {
    const mapping: ColumnMapping = {
      from_field: field,
      to_field: '',
      to_table_name: 'PropertyState',
      from_units: '',
      is_omitted: false,
    }
    this.profile.mappings.push(mapping)
  }
}
