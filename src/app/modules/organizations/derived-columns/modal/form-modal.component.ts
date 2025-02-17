import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatOptionModule } from '@angular/material/core'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { Subject, takeUntil, tap } from 'rxjs'
import { OrganizationService } from '@seed/api/organization'
import { SnackbarService } from 'app/core/snackbar/snackbar.service'
import type { DerivedColumn} from '@seed/api/derived-column';
import { DerivedColumnService } from '@seed/api/derived-column'
import type { InventoryType } from 'app/modules/inventory/inventory.types'

@Component({
  selector: 'seed-organizations-members-form-modal',
  templateUrl: './form-modal.component.html',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatDialogModule,
    FormsModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
})
export class FormModalComponent implements OnDestroy, OnInit {
  private _dialogRef = inject(MatDialogRef<FormModalComponent>)
  private _derivedColumnService = inject(DerivedColumnService)
  private _organizationService = inject(OrganizationService)
  private _snackBar = inject(SnackbarService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  // types = ['Property', 'Tax Lot']
  inventoryTypes = [{ id: 'properties', label: 'Property' }, { id: 'taxlots', label: 'Tax Lot' }]
  data = inject(MAT_DIALOG_DATA) as { derivedColumn: DerivedColumn | null; orgId: number; inventoryType: { id: string; label: string } }
  form = new FormGroup({
    name: new FormControl<string | null>('', Validators.required),
    type: new FormControl<string | null>(this.data.inventoryType.id, Validators.required),
    // parameters: new FormArray<FormGroup<{
    //   name: FormControl<string | null>;
    //   sourceColumn: FormControl<string | null>;
    // }>>([]),
    // sourceColumn: new FormControl<string | null>('', Validators.required),
    expression: new FormControl<string | null>(null, Validators.required),
  })
  create = this.data.derivedColumn ? false : true

  ngOnInit(): void {
    console.log('init')
    this.form.patchValue(this.data.derivedColumn)
    // watch for changes to type and repopulate source columns
    // todo: fetch source columns
    this.getSourceColumns('properties')
  }

  // get parameters(): FormArray {
  //   return this.form.get('parameters') as FormArray
  // }

  // addParameter(): void {
  //   this.parameters.push(new FormGroup({
  //     name: new FormControl<string | null>('', Validators.required),
  //     // needs to be source column id?
  //     sourceColumn: new FormControl<string | null>('', Validators.required),
  //   }))
  // }

  // removeParameter(index: number): void {
  //   this.parameters.removeAt(index)
  // }

  getSourceColumns(type: InventoryType) {
    console.log('get source columns', type)
  }

  onSubmit(): void {
    // // needs to be parameters?
    const fn = this.create
      ? this._derivedColumnService.post(this.form.value as DerivedColumn, this.data.orgId)
      : this._derivedColumnService.put(this.form.value as DerivedColumn, this.data.orgId)

    console.log(fn)
  }

  dismiss() {
    this._dialogRef.close()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
