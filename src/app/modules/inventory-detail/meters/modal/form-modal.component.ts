import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatOptionModule } from '@angular/material/core'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import type { GroupService, GroupSystem, InventoryGroup } from '@seed/api/groups'
import { GroupsService } from '@seed/api/groups'
import type { Meter, MeterConfig} from '@seed/api/meters'
import { MeterService } from '@seed/api/meters'
import { OrganizationService } from '@seed/api/organization'
import { UserService } from '@seed/api/user'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import { Subject, takeUntil, tap } from 'rxjs'

@Component({
  selector: 'seed-organizations-members-form-modal',
  templateUrl: './form-modal.component.html',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatOptionModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
})
export class FormModalComponent implements OnDestroy, OnInit {
  private _dialogRef = inject(MatDialogRef<FormModalComponent>)
  private _organizationService = inject(OrganizationService)
  private _groupsService = inject(GroupsService)
  private _meterService = inject(MeterService)
  private _userService = inject(UserService)
  private _snackBar = inject(SnackBarService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  data = inject(MAT_DIALOG_DATA) as { meter: Meter; orgId: number; groupId: number | null; viewId: number | null }
  groups: InventoryGroup[]
  systems: GroupSystem[]
  services: GroupService[]

  form = new FormGroup({
    direction: new FormControl<'imported' | 'exported'>(null, Validators.required),
    connection: new FormControl<'outside' | 'service'>(null, Validators.required),
    use: new FormControl<string>(null),
    group_id: new FormControl<number>(null),
    system_id: new FormControl<number>(null),
    service_id: new FormControl<number>(null),
  })

  directionOptions = [
    { display: 'Imported', value: 'imported' },
    { display: 'Exported', value: 'exported' },
  ]
  connectionOptions = [
    { display: 'Connected to Outside', value: 'outside' },
    { display: 'Connected to a Service', value: 'service' },
  ]
  useOptions = [
    { display: 'Using a Service', value: 'using' },
  ]
  groupOptions: InventoryGroup[] = []
  systemOptions: GroupSystem[] = []
  serviceOptions: GroupService[] = []

  ngOnInit(): void {
    this.getDependencies().pipe(
      tap(() => {
        this.patchForm()
        this.watchForm()
      }),
    ).subscribe()
  }

  getDependencies() {
    setTimeout(() => {
      if (this.data.meter.property_id) {
        this._groupsService.listForInventory(this.data.orgId, [this.data.meter.property_id])
      } else {
        this._groupsService.list(this.data.orgId)
      }
    })

    return this._groupsService.groups$.pipe(
      tap((groups) => { this.groupOptions = groups }),
    )
  }

  patchForm() {
    if (this.data.meter.system_id) {
      this.useOptions.push({ display: 'Offering a Service (Total)', value: 'offering' })
    }

    this.form.patchValue(this.data.meter.config)
  }

  watchForm() {
    this.form.get('connection')?.valueChanges.subscribe((value) => {
      this.connectionChange(value)
    })

    this.form.get('group_id')?.valueChanges.subscribe((groupId) => {
      this.groupChange(groupId)
    })

    this.form.get('system_id')?.valueChanges.subscribe((systemId) => {
      this.systemChange(systemId)
    })
  }

  connectionChange(connection: 'outside' | 'service') {
    // reset downstream values
    const keys = ['use', 'group_id', 'system_id', 'service_id']
    for (const key of keys) {
      this.form.get(key)?.reset()
    }
    // if outside form is complete
    if (connection === 'outside') return

    // if a property meter, show all groups. otherwise system_id will dictate group_id
    if (this.data.meter.property_id) {
      this.form.get('use')?.setValue('using')
    }
  }

  groupChange(groupId: number) {
    if (!groupId) return
    this.systemOptions = this.groupOptions.find((g) => g.id === groupId)?.systems || []
    this.serviceOptions = []
  }

  systemChange(systemId: number) {
    if (!systemId) return
    this.serviceOptions = this.systemOptions.find((s) => s.id === systemId).services
  }

  get formValid() {
    if (this.form.get('connection').value === 'outside') {
      return this.form.valid
    }

    const allTruthy = Object.values(this.form.value).every((v) => !!v)
    return allTruthy && this.form.valid
  }

  onSubmit() {
    this._meterService.updateMeterConnection(this.data.orgId, this.data.meter.id, this.form.value as MeterConfig, this.data.viewId, this.data.groupId).pipe(
      takeUntil(this._unsubscribeAll$),
      tap(() => {
        this._snackBar.success('Meter connection updated successfully')
        this._dialogRef.close(true)
      }),
    ).subscribe()
  }

  close(success = false) {
    this._dialogRef.close(success)
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
