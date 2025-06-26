import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDivider } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { Subject, switchMap, takeUntil, tap } from 'rxjs'
import { GroupsService } from '@seed/api/groups/groups.service'
import type { InventoryGroup } from '@seed/api/groups/groups.types'
import { type AccessLevelInstancesByDepth, type AccessLevelsByDepth, OrganizationService } from '@seed/api/organization'
import { SEEDValidators } from '@seed/validators'

@Component({
  selector: 'seed-inventory-list-groups-form-modal',
  templateUrl: './form-modal.component.html',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatDivider,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
})
export class FormModalComponent implements OnDestroy, OnInit {
  private _dialogRef = inject(MatDialogRef<FormModalComponent>)
  private _groupsService = inject(GroupsService)
  private _organizationService = inject(OrganizationService)
  private readonly _unsubscribeAll$ = new Subject<void>()

  accessLevelNames: AccessLevelInstancesByDepth['accessLevelNames']
  accessLevelInstancesByDepth: AccessLevelsByDepth = {}
  accessLevelInstances: AccessLevelsByDepth[keyof AccessLevelsByDepth] = []

  data = inject(MAT_DIALOG_DATA) as {
    id: number;
    group: InventoryGroup;
    groups: InventoryGroup[];
    mode: 'create' | 'edit';
    orgId: number;
  }

  existingNames = this.data.groups?.map((g) => g.name).filter((name) => name !== this.data.group?.name) ?? []
  form = new FormGroup({
    name: new FormControl<string | null>('', [Validators.required, SEEDValidators.uniqueValue(this.existingNames)]),
    access_level: new FormControl<string | null>(null),
    access_level_instance: new FormControl<number | null>(null, Validators.required),
  })

  ngOnInit(): void {
    this.form.patchValue(this.data.group)
    this.getDependencies()
    this.watchAccessLevel()
  }

  watchAccessLevel() {
    // update access level instances if the access level changes
    this.form
      .get('access_level')
      .valueChanges.pipe(
        takeUntil(this._unsubscribeAll$),
        tap((accessLevel) => {
          this.getPossibleAccessLevelInstances(accessLevel)
          // default to first access level instance
          this.form.get('access_level_instance')?.setValue(this.accessLevelInstances[0]?.id)
        }),
      )
      .subscribe()
  }

  getDependencies() {
    this._organizationService.accessLevelTree$
      .pipe(
        takeUntil(this._unsubscribeAll$),
        switchMap(({ accessLevelNames }) => {
          this.accessLevelNames = accessLevelNames
          const accessLevel = this.form.get('access_level')?.value ?? accessLevelNames.at(-1)
          this.form.get('access_level')?.setValue(accessLevel)
          return this._organizationService.accessLevelInstancesByDepth$
        }),
        tap((accessLevelsByDepth) => {
          this.accessLevelInstancesByDepth = accessLevelsByDepth
          this.getPossibleAccessLevelInstances(this.form.get('access_level')?.value)
          this.form.get('access_level_instance')?.setValue(this.accessLevelInstances[0]?.id)
        }),
      )
      .subscribe()
  }

  getPossibleAccessLevelInstances(accessLevelName: string): void {
    const depth = this.accessLevelNames.findIndex((name) => name === accessLevelName)
    this.accessLevelInstances = this.accessLevelInstancesByDepth[depth]
  }

  onCreate() {
    const data = {
      inventory_type: 'Property',
      organization: this.data.orgId,
      name: this.form.value.name,
      access_level_instance: this.form.value.access_level_instance,
    }

    this._groupsService.create(this.data.orgId, data as InventoryGroup).subscribe(({ id }) => {
      this._dialogRef.close(id)
    })
  }

  onEdit() {
    const data = { ...this.data.group, name: this.form.value.name }
    this._groupsService.update(this.data.orgId, this.data.id, data).subscribe(({ id }) => {
      this._dialogRef.close(id)
    })
  }

  dismiss() {
    this._dialogRef.close()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
