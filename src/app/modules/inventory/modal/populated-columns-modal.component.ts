import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressBar } from '@angular/material/progress-bar'
import { finalize, Subject, tap } from 'rxjs'
import type { Column } from '@seed/api/column'
import { InventoryService } from '@seed/api/inventory'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import type { InventoryType, Profile } from '../inventory.types'

@Component({
  selector: 'seed-populated-columns-modal',
  templateUrl: './populated-columns-modal.component.html',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBar,
    ReactiveFormsModule,
  ],
})
export class PopulatedColumnsModalComponent {
  private _dialogRef = inject(MatDialogRef<PopulatedColumnsModalComponent>)
  private _inventoryService = inject(InventoryService)
  private _snackBar = inject(SnackBarService)

  form = new FormGroup({
    name: new FormControl<string | null>('', [
      Validators.required,
    ]),
  })

  data = inject(MAT_DIALOG_DATA) as {
    orgId: number;
    columns: Column[];
    profile: Profile;
    cycleId: number;
    inventoryType: InventoryType;
  }
  errorMessage = false
  inProgress = false

  close(message = null) {
    this._dialogRef.close(message)
  }

  dismiss() {
    this._dialogRef.close()
  }

  onStart() {
    this.inProgress = true
    const displayType = this.data.inventoryType === 'taxlots' ? 'Tax Lot' : 'Property'
    const { orgId, profile, cycleId } = this.data

    this._inventoryService.updateProfileToShowPopulatedColumns(orgId, profile.id, cycleId, displayType).pipe(
      tap(() => { this._snackBar.success('Profile updated') }),
      finalize(() => {
        setTimeout(() => {
          this.inProgress = false
        }, 1000)
        this.close('refresh')
      }),
    ).subscribe()
  }

  onCreate() {
    console.log('create')
  }
}
