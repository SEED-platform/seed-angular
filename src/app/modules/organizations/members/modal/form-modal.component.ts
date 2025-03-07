import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatOptionModule } from '@angular/material/core'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import type { Observable } from 'rxjs'
import { forkJoin, Subject, takeUntil, tap } from 'rxjs'
import type { AccessLevelsByDepth, OrganizationUser } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import type { CreateUserRequest, UserRole } from '@seed/api/user'
import { UserService } from '@seed/api/user'
import { SnackbarService } from 'app/core/snackbar/snackbar.service'

@Component({
  selector: 'seed-organizations-members-form-modal',
  templateUrl: './form-modal.component.html',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
})
export class FormModalComponent implements OnDestroy, OnInit {
  private _dialogRef = inject(MatDialogRef<FormModalComponent>)
  private _organizationService = inject(OrganizationService)
  private _userService = inject(UserService)
  private _snackBar = inject(SnackbarService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  accessLevelNames: string[]
  accessLevelInstancesByDepth: AccessLevelsByDepth = {}
  accessLevelInstances: { id: number; name: string }[] = []
  roles = ['owner', 'member', 'viewer']
  data = inject(MAT_DIALOG_DATA) as { member: OrganizationUser | null; orgId: number }
  form = new FormGroup({
    first_name: new FormControl<string | null>('', Validators.required),
    last_name: new FormControl<string | null>('', Validators.required),
    email: new FormControl<string | null>('', [Validators.required, Validators.email]),
    access_level: new FormControl<string | null>('', Validators.required),
    access_level_instance_id: new FormControl<number | null>(null, Validators.required),
    role: new FormControl<UserRole | null>('member', Validators.required),
  })
  create = true

  ngOnInit(): void {
    this.form.patchValue(this.data.member)
    // disable name and email if editing existing member
    if (this.data.member) {
      this.create = false
      this.form.get('first_name')?.disable()
      this.form.get('last_name')?.disable()
      this.form.get('email')?.disable()
    }
    // watch for changes to access level and repopulate access level instances
    this.form
      .get('access_level')
      ?.valueChanges.pipe(
        takeUntil(this._unsubscribeAll$),
        tap((accessLevel) => {
          this.getPossibleAccessLevelInstances(accessLevel)
          // default to first access level instance
          this.form.get('access_level_instance_id')?.setValue(this.accessLevelInstances[0]?.id)
        }),
      )
      .subscribe()
    // prevent ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this._organizationService.accessLevelTree$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((accessLevelTree) => {
        this.accessLevelNames = accessLevelTree.accessLevelNames
        this.accessLevelInstancesByDepth = accessLevelTree.accessLevelInstancesByDepth
        this.getPossibleAccessLevelInstances(this.form.get('access_level')?.value)
      })
    })
  }

  getAccessLevelTree(orgId: number): void {
    this._organizationService.getOrganizationAccessLevelTree(orgId).subscribe()
  }

  getPossibleAccessLevelInstances(accessLevelName: string): void {
    const access_level_idx = this.accessLevelNames.findIndex((name) => name === accessLevelName)
    this.accessLevelInstances = this.accessLevelInstancesByDepth[access_level_idx]
  }

  onSubmit(): void {
    const fn = this.create ? this.createMember : this.editMember
    fn()
  }

  createMember() {
    console.log('create')
    const { first_name, last_name, email, access_level_instance_id, role } = this.form.value
    const userDetails: CreateUserRequest = {
      first_name,
      last_name,
      email,
      access_level_instance_id,
      role,
      org_name: null,
    }
    this._userService.createUser(this.data.orgId, userDetails).subscribe(() => {
      this._dialogRef.close()
    })
  }

  editMember() {
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
      forkJoin(requests)
        .pipe(
          takeUntil(this._unsubscribeAll$),
          tap(() => {
            this._snackBar.success('User updated')
            this._dialogRef.close()
          }),
        )
        .subscribe()
    }
  }

  dismiss() {
    this._dialogRef.close('dismiss')
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
