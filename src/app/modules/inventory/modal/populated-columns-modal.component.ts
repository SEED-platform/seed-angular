import type { OnDestroy } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import type { Column } from '@seed/api/column'
import { Subject } from 'rxjs'
import type { InventoryType, Profile } from '../inventory.types'

@Component({
  selector: 'seed-populated-columns-modal',
  templateUrl: './populated-columns-modal.component.html',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
})
export class PopulatedColumnsModalComponent implements OnDestroy {
  private _dialogRef = inject(MatDialogRef<PopulatedColumnsModalComponent>)
  private readonly _unsubscribeAll$ = new Subject<void>()

  form = new FormGroup({
    name: new FormControl<string | null>('', [
      Validators.required,
    ]),
  })

  data = inject(MAT_DIALOG_DATA) as {
    orgId: number;
    columns: Column[];
    profile: Profile | null;
    cycleId: number;
    inventoryType: InventoryType;
  }
  errorMessage = false

  close() {
    this._dialogRef.close()
  }

  dismiss() {
    console.log('dismiss')
    this._dialogRef.close()
  }

  onStart() {
    console.log('start')
  }

  onCreate() {
    console.log('create')
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
