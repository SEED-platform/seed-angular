import { CommonModule } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import type { Column } from "@seed/api/column";
import { ViewResponse } from "../../inventory.types";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from "@angular/material/input";
import { MatDividerModule } from "@angular/material/divider";
import { MatTableModule } from "@angular/material/table";


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
  private fb = inject(FormBuilder)

  data = inject(MAT_DIALOG_DATA) as { columns: Column[]; orgId: number; view: ViewResponse}
  form: FormGroup
  labelWidth: number
  changedFields: Set<string>
  displayNameMap: { [key: string]: string } = {}


  ngOnInit() {
    this.setForm()
  }

  /*
  * Generates the form for the main state based on the profile columns
  * detects value changes and highlights border
  */
  setForm() {
    const controls: { [key: string]: FormControl } = {}
    const state = this.data.view.state
    this.changedFields = new Set<string>()
    const filteredCols = this.data.columns.filter((c) => !c.derived_column)

    for (let {column_name, display_name} of filteredCols) {
      const displayName = display_name || column_name
      const control = new FormControl(state[column_name])
    
      control.valueChanges.subscribe(() => {
        this.changedFields.add(column_name)
      })
    
      controls[column_name] = control
      this.displayNameMap[column_name] = displayName
    }
    this.form = this.fb.group(controls)
  }

  onSubmit() {
    console.log('submit')
    this.data.view.state = {...this.data.view.state, ...this.form.value}
    this._dialogRef.close()
  }

  dismiss() {
    this._dialogRef.close()
  }
  
}