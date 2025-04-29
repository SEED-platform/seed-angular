import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressBar } from '@angular/material/progress-bar'
import { finalize, tap } from 'rxjs'
import type { Column } from '@seed/api/column'
import { InventoryService } from '@seed/api/inventory'
import { SEEDValidators } from '@seed/validators'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import type { InventoryDisplayType, InventoryType, Profile, ProfileLocation, ProfileModalMode } from 'app/modules/inventory/inventory.types'

@Component({
  selector: 'seed-column-list-profile-modal',
  templateUrl: './modal.component.html',
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
export class ModalComponent {
  private _dialogRef = inject(MatDialogRef<ModalComponent>)
  private _inventoryService = inject(InventoryService)
  private _snackBar = inject(SnackBarService)

  data = inject(MAT_DIALOG_DATA) as {
    columns: Column[];
    cycleId: number;
    inventoryType: InventoryType;
    mode: ProfileModalMode;
    orgId: number;
    profile: Profile;
    profiles: Profile[];
    location: ProfileLocation;
    type: InventoryDisplayType;
  }

  existingNames = this.data.profiles?.map((p) => p.name).filter((name) => name !== this.data.profile?.name) ?? []

  form = new FormGroup({
    name: new FormControl<string | null>('', [
      Validators.required,
      SEEDValidators.uniqueValue(this.existingNames),
    ]),
  })

  errorMessage = false
  inProgress = false

  get createMode() {
    const populateCreate = this.data.mode === 'populate' && !this.data.profile
    return this.data.mode === 'create' || populateCreate
  }

  get populateMode() {
    return this.data.mode === 'populate' && this.data.profile
  }

  close(message = null) {
    this._dialogRef.close(message)
  }

  dismiss() {
    this._dialogRef.close()
  }

  onPopulated() {
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
    const data = {
      name: this.form.get('name')?.value,
      profile_location: this.data.location,
      inventory_type: this.data.type,
      columns: this.data.columns,
      derived_columns: [],
    }

    this._inventoryService.createColumnListProfile(this.data.orgId, data).pipe(
      tap((profile) => {
        this.data.profile = profile
        // do not close if a show populated columns request
        if (this.data.mode === 'create') {
          this.close({ profileId: profile.id })
        }
      }),
    ).subscribe()
  }

  onDelete() {
    this._inventoryService.deleteColumnListProfile(this.data.orgId, this.data.profile.id).subscribe(() => {
      console.log('DEVELOPER NOTE: Delete function fails while in development mode, via a vite proxy error')
      this.close({ profileId: null })
    })
  }

  onRename() {
    const data = {
      name: this.form.get('name')?.value,
      profile_location: this.data.location,
      inventory_type: this.data.type,
      columns: this.data.columns,
      derived_columns: [],
    }
    this._inventoryService.updateColumnListProfile(this.data.orgId, this.data.profile.id, data).subscribe(() => {
      this.close({ profileId: this.data.profile.id })
    })
  }
}
