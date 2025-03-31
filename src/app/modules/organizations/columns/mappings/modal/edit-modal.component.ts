import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { type Column } from '@seed/api/column'
import { type ColumnMapping, type ColumnMappingProfile, ColumnMappingProfileService } from '@seed/api/column_mapping_profile'
import { AlertComponent } from '@seed/components'
import { SeedHeaderAutocompleteComponent } from './seed-header-autocomplete.component'

@Component({
  selector: 'seed-column-mappings-edit-modal',
  templateUrl: './edit-modal.component.html',
  imports: [AlertComponent, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule, SeedHeaderAutocompleteComponent],
})
export class EditModalComponent implements OnInit {
  private _dialogRef = inject(MatDialogRef<EditModalComponent>)
  errorMessage: string
  inProgress = false
  mapping: ColumnMapping
  profile: ColumnMappingProfile
  columns: Column[]
  form = new FormGroup({
    is_omitted: new FormControl<boolean | null>(null),
    to_table_name: new FormControl<string>('', [Validators.required]),
    to_field: new FormControl<string>('', [Validators.required]),
    from_field: new FormControl<string>('', [Validators.required]),
    from_units: new FormControl<string>(''),

  })
  data = inject(MAT_DIALOG_DATA) as { mapping: ColumnMapping; org_id: number, columns: Column[], profile: ColumnMappingProfile }

  ngOnInit(): void {
    this.mapping = this.data.mapping
    this.columns = this.data.columns
    this.profile = this.data.profile
    this.form.patchValue(this.mapping)
  }

  onSubmit() {
    console.log('Saving: ', this.form.value)
    this._dialogRef.close(this.form.value as ColumnMapping)
  }

  close() {
    this._dialogRef.close()
  }

  readonly(): boolean {
    if (this.profile && this.profile.profile_type !== 'Normal') {
      return true
    } else {
      return false
    }
  }

  unitSelections(mapping: ColumnMapping) {
    const col = this.columns.find((c) => c.column_name === mapping.to_field)
    if (!col) {
      return []
    }
    switch (col.data_type) {
      case 'area':
        return [
          { id: 'ft**2', value: 'square feet' },
          { id: 'm**2', value: 'square metres' },
        ]
      case 'eui':
        return [
          { id: 'kBtu/ft**2/year', value: 'kBtu/ft²/year' },
          { id: 'kWh/m**2/year', value: 'kWh/m²/year' },
          { id: 'GJ/m**2/year', value: 'GJ/m²/year' },
          { id: 'MJ/m**2/year', value: 'MJ/m²/year' },
          { id: 'kBtu/m**2/year', value: 'kBtu/m²/year' },
        ]
      case 'ghg':
        return [
          { id: 'MtCO2e/year', value: 'MtCO2e/year' },
          { id: 'kgCO2e/year', value: 'kgCO2e/year' },
        ]
      case 'wui':
        return [
          { id: 'kgal/ft**2/year', value: 'kgal/ft²/year' },
          { id: 'gal/ft**2/year', value: 'gal/ft²/year' },
          { id: 'L/m**2/year', value: 'L/m²/year' },
        ]
      case 'ghg_intensity':
        return [
          { id: 'MtCO2e/ft**2/year', value: 'MtCO2e/ft²/year' },
          { id: 'kgCO2e/ft**2/year', value: 'kgCO2e/ft²/year' },
          { id: 'MtCO2e/m**2/year', value: 'MtCO2e/m²/year' },
          { id: 'kgCO2e/m**2/year', value: 'kgCO2e/m²/year' },
        ]
      case 'water_use':
        return [
          { id: 'kgal/year', value: 'kgal/year' },
          { id: 'gal/year', value: 'gal/year' },
          { id: 'L/year', value: 'L/year' },
        ]
      default:
        return []
    }
  }
}
