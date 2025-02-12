import { CommonModule } from '@angular/common'
import { Component, inject, type OnInit } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatOptionModule } from '@angular/material/core'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import type { Observable } from 'rxjs'
import { forkJoin } from 'rxjs'
import type { AccessLevelsByDepth, OrganizationUser } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import { UserService } from '@seed/api/user'
import { SnackbarService } from 'app/core/snackbar/snackbar.service'

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
export class FormModalComponent implements OnInit {
  private _dialogRef = inject(MatDialogRef<FormModalComponent>)
  private _organizationService = inject(OrganizationService)
  private _userService = inject(UserService)
  private _snackBar = inject(SnackbarService)
  accessLevelNames: string[]
  accessLevelInstancesByDepth: AccessLevelsByDepth = {}
  accessLevelInstances: { id: number; name: string }[] = []
  roles = ['owner', 'member', 'viewer']
  data = inject(MAT_DIALOG_DATA) as { member: OrganizationUser | null; orgId: number }
  form = new FormGroup({
    first_name: new FormControl<string | null>(''),
    last_name: new FormControl<string | null>(''),
    email: new FormControl<string | null>('', Validators.required),
    access_level: new FormControl<string | null>('', Validators.required),
    access_level_instance_id: new FormControl<number | null>(null, Validators.required),
    role: new FormControl<string | null>('', Validators.required),
  })

  ngOnInit(): void {
    this.form.patchValue(this.data.member)
    // watch for changes to access level and repopulate access level instances
    this.form.get('access_level')?.valueChanges.subscribe((accessLevel) => {
      this.getPossibleAccessLevelInstances(accessLevel)
      // default to first access level instance
      this.form.get('access_level_instance_id')?.setValue(this.accessLevelInstances[0]?.id)
    })
    // prevent ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.getAccessLevelTree(this.data.orgId)
    })
  }

  getAccessLevelTree(orgId: number): void {
    // fetch access level tree
    this._organizationService.getOrganizationAccessLevelTree(orgId)
    // subscribe to stream and set access level tree/names
    this._organizationService.accessLevelTree$.subscribe((accessLevelTree) => {
      this.accessLevelNames = accessLevelTree.accessLevelNames
      this.accessLevelInstancesByDepth = accessLevelTree.accessLevelInstancesByDepth
      this.getPossibleAccessLevelInstances(this.form.get('access_level')?.value)
    })
  }

  getPossibleAccessLevelInstances(accessLevelName: string): void {
    const access_level_idx = this.accessLevelNames.findIndex((name) => name === accessLevelName)
    this.accessLevelInstances = this.accessLevelInstancesByDepth[access_level_idx]
  }

  onSubmit(): void {
    const { member, orgId } = this.data
    const { role, access_level, access_level_instance_id } = this.form.value
    const requests: Observable<{ status: string }>[] = []

    // update role
    if (member.role !== role) {
      requests.push(this._userService.updateUserRole(member.user_id, orgId, role))
    }
    // update access levels
    if (member.access_level !== access_level || member.access_level_instance_id !== access_level_instance_id) {
      requests.push(this._userService.updateUserAccessLevelInstance(member.user_id, orgId, access_level_instance_id))
    }
    // wait for both to finish
    if (requests.length) {
      forkJoin(requests).subscribe(() => {
        this._snackBar.success('User updated', 'OK', true, 3000)
        this._dialogRef.close()
      })
    }
  }

  dismiss() {
    this._dialogRef.close('dismiss')
  }
}
