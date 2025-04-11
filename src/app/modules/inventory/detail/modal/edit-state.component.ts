import { CommonModule } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { Column } from "ag-grid-community";
import { ViewResponse } from "../../inventory.types";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'


@Component({
  selector: 'seed-inventory-detail-edit-state',
  templateUrl: './edit-state.component.html',
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
})
export class EditStateModalComponent implements OnInit {
  private _dialogRef = inject(MatDialogRef<EditStateModalComponent>)

  data = inject(MAT_DIALOG_DATA) as { columns: Column[]; orgId: number; view: ViewResponse}

  form = new FormGroup({})

  ngOnInit() {
    console.log('modal data', this.data)
  }

  onSubmit() {
    console.log('submit')
    this._dialogRef.close()
  }

  dismiss() {
    this._dialogRef.close()
  }
  
}