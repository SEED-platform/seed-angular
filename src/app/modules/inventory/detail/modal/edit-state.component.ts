import { CommonModule } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import type { FormGroup } from '@angular/forms'
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatTableModule } from '@angular/material/table'
import type { Column } from '@seed/api/column'
import type { ViewResponse } from '../../inventory.types'

@Component({
  selector: 'seed-inventory-detail-edit-state',
  templateUrl: './edit-state.component.html',
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    ReactiveFormsModule,
  ],
})
export class EditStateModalComponent implements OnInit {
  private _dialogRef = inject(MatDialogRef<EditStateModalComponent>)
  private _fb = inject(FormBuilder)

  data = inject(MAT_DIALOG_DATA) as { columns: Column[]; orgId: number; view: ViewResponse }
  form: FormGroup<Record<string, FormControl>>
  labelWidth: number
  changedFields: Set<string>
  displayNameMap: Record<string, string> = {}

  ngOnInit() {
    this.setForm()
  }

  /*
  * Generates the form for the main state based on the profile columns
  * detects value changes and highlights border
  */
  setForm() {
    const controls: Record<string, FormControl> = {}
    const state = this.data.view.state
    this.changedFields = new Set<string>()
    const filteredCols = this.data.columns.filter((c) => !c.derived_column)

    for (const { column_name, display_name } of filteredCols) {
      const displayName = display_name || column_name
      const control = new FormControl(state[column_name])

      control.valueChanges.subscribe(() => {
        this.changedFields.add(column_name)
      })

      controls[column_name] = control
      this.displayNameMap[column_name] = displayName
    }
    this.form = this._fb.group(controls)
  }

  onSubmit() {
    console.log('submit')
    this.data.view.state = { ...this.data.view.state, ...this.form.value }
    this._dialogRef.close()
  }

  dismiss() {
    this._dialogRef.close()
  }
}
