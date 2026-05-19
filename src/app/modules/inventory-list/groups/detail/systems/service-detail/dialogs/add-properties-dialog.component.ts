import { Component, inject, type OnInit } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { tap } from 'rxjs'
import type { GroupProperty } from '@seed/api'
import { GroupsService } from '@seed/api'
import { MaterialImports } from '@seed/materials'

export interface AddPropertiesDialogData {
  orgId: number;
  groupId: number;
  systemId: number;
  serviceId: number;
}

@Component({
  selector: 'seed-add-properties-dialog',
  templateUrl: './add-properties-dialog.component.html',
  imports: [MaterialImports, ReactiveFormsModule],
})
export class AddPropertiesDialogComponent implements OnInit {
  private _dialogRef = inject(MatDialogRef<AddPropertiesDialogComponent>)
  private _groupsService = inject(GroupsService)
  data = inject<AddPropertiesDialogData>(MAT_DIALOG_DATA)

  properties: GroupProperty[] = []
  selectedProperties: GroupProperty[] = []
  availableProperties: GroupProperty[] = []
  errorMessage: string | null = null
  submitted = false

  meterTypes = [
    'Coal (anthracite)',
    'Coal (bituminous)',
    'Coke',
    'Diesel',
    'District Chilled Water',
    'District Chilled Water - Absorption',
    'District Chilled Water - Electric',
    'District Chilled Water - Engine',
    'District Chilled Water - Other',
    'District Hot Water',
    'District Steam',
    'Electric',
    'Electric - Grid',
    'Electric - Solar',
    'Electric - Wind',
    'Fuel Oil (No. 1)',
    'Fuel Oil (No. 2)',
    'Fuel Oil (No. 4)',
    'Fuel Oil (No. 5 and No. 6)',
    'Kerosene',
    'Natural Gas',
    'Other',
    'Propane',
    'Wood',
    'Cost',
    'Electric - Unknown',
    'Custom Meter',
    'Potable Indoor',
    'Potable Outdoor',
    'Potable: Mixed Indoor/Outdoor',
  ]

  directionOptions = [
    { display: 'Imported', value: 'imported' },
    { display: 'Exported', value: 'exported' },
  ]

  form = new FormGroup({
    type: new FormControl<string>(null, Validators.required),
    direction: new FormControl<string>('imported', Validators.required),
  })

  ngOnInit() {
    this._groupsService.getProperties(this.data.orgId, this.data.groupId).pipe(
      tap((properties) => {
        this.properties = properties
        this.availableProperties = [...properties]
      }),
    ).subscribe()
  }

  selectProperty(propertyId: number) {
    if (!propertyId) return
    const prop = this.properties.find((p) => p.property_id === propertyId)
    if (prop && !this.selectedProperties.includes(prop)) {
      this.selectedProperties.push(prop)
      this.availableProperties = this.availableProperties.filter((p) => p.property_id !== propertyId)
    }
  }

  removeProperty(prop: GroupProperty) {
    this.selectedProperties = this.selectedProperties.filter((p) => p !== prop)
    this.availableProperties.push(prop)
  }

  onSubmit() {
    if (this.form.invalid || this.selectedProperties.length === 0) return
    this.submitted = true
    this.errorMessage = null

    const payload = {
      type: this.form.value.type,
      direction: this.form.value.direction,
      property_ids: this.selectedProperties.map((p) => p.property_id),
    }

    this._groupsService.createServiceMeters(
      this.data.orgId, this.data.groupId, this.data.systemId, this.data.serviceId, payload,
    ).subscribe({
      next: () => {
        this._dialogRef.close(true)
      },
      error: (err) => {
        this.submitted = false
        this.errorMessage = err?.error?.errors ?? err?.error?.message ?? 'Failed to create meters'
      },
    })
  }

  dismiss() {
    this._dialogRef.close()
  }
}
