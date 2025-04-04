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
import type { AccessLevelInstancesByDepth, AccessLevelsByDepth, OrganizationUser } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import { UserService } from '@seed/api/user'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'

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
  private _snackBar = inject(SnackBarService)
  data = inject(MAT_DIALOG_DATA) as { member: OrganizationUser | null; orgId: number }

  private readonly _unsubscribeAll$ = new Subject<void>()
  accessLevelNames: AccessLevelInstancesByDepth['accessLevelNames']
  accessLevelInstancesByDepth: AccessLevelsByDepth = {}
  accessLevelInstances: AccessLevelsByDepth[keyof AccessLevelsByDepth] = []
  roles = ['owner', 'member', 'viewer']
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

    this._organizationService.accessLevelTree$.pipe(takeUntil(this._unsubscribeAll$)).subscribe(({ accessLevelNames }) => {
      this.accessLevelNames = accessLevelNames
    })

    this._organizationService.accessLevelInstancesByDepth$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((accessLevelsByDepth) => {
      this.accessLevelInstancesByDepth = accessLevelsByDepth
      this.getPossibleAccessLevelInstances(this.form.get('access_level')?.value)
    })
  }

  getPossibleAccessLevelInstances(accessLevelName: string): void {
    const depth = this.accessLevelNames.findIndex((name) => name === accessLevelName)
    this.accessLevelInstances = this.accessLevelInstancesByDepth[depth]
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
