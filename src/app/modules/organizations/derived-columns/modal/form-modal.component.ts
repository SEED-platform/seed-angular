import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
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
  types = ['Property', 'Tax Lot']
  data = inject(MAT_DIALOG_DATA) as { derivedColumn: DerivedColumn | null; orgId: number; type: InventoryType }
  form = new FormGroup({
    name: new FormControl<string | null>('', Validators.required),
    type: new FormControl<string | null>(this.data.type, Validators.required),
    paramA: new FormControl<string | null>('', Validators.required),
    sourceColumn: new FormControl<string | null>('', Validators.required),
    expression: new FormControl<string | null>(null, Validators.required),
  })
  create = this.data.derivedColumn ? false : true

  ngOnInit(): void {
    console.log('init')
    this.form.patchValue(this.data.derivedColumn)
    // watch for changes to type and repopulate source columns
    // todo: fetch source columns
  }
  //   // prevent ExpressionChangedAfterItHasBeenCheckedError
  //   setTimeout(() => {
  //     this.getAccessLevelTree(this.data.orgId)
  //   })
  // }

  getSourceColumns(type: InventoryType) {
    console.log('get source columns', type)
  }

  onSubmit(): void {
    // const fn = this.create
    // // needs to be parameters?
    // // RP HERE
    //   ? this._derivedColumnService.post(this.form.value, this.data.orgId)
    //   : this._derivedColumnService.put(this.form.value, this.data.orgId)
    // const { derivedColumn, orgId } = this.data
    // // const { name, type, paramA, sourceColumn, expression } = this.form.value

    // this._derivedColumnService.post(derivedColumn, orgId)
    //   .pipe(
    //     takeUntil(this._unsubscribeAll$),
    //     tap(() => {

    //     })
    //   )
    //   .subscribe()

    // // update role
    // if (member.role !== role) {
    //   requests.push(this._userService.updateUserRole(member.user_id, orgId, role))
    // }
    // // update access levels
    // if (member.access_level !== access_level || member.access_level_instance_id !== access_level_instance_id) {
    //   requests.push(this._userService.updateUserAccessLevelInstance(member.user_id, orgId, access_level_instance_id))
    // }
    // // wait for both to finish
    // if (requests.length) {
    //   forkJoin(requests).subscribe(() => {
    //     this._snackBar.success('User updated')
    //     this._dialogRef.close()
    //   })
    // }
  }

  dismiss() {
    this._dialogRef.close()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
