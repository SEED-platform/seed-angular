import { CommonModule } from '@angular/common'
import { Component, inject, type OnDestroy, type OnInit } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButton } from '@angular/material/button'
import { MatDivider } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatSelectModule } from '@angular/material/select'
import { Subject, takeUntil } from 'rxjs'
import { type Organization, OrganizationService } from '@seed/api/organization'
import { PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import * as UnitOptions from './units.types'

@Component({
  selector: 'seed-organizations-settings-units',
  templateUrl: './units.component.html',
  imports: [CommonModule, SharedImports, MatButton, MatDivider, MatFormFieldModule, MatIconModule, MatSelectModule, ReactiveFormsModule, PageComponent],
})
export class UnitsComponent implements OnDestroy, OnInit {
  private _organizationService = inject(OrganizationService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  betterVerifiedIcon = ''
  betterVerifiedIconColor = 'primary'
  organization: Organization
  options = UnitOptions

  unitsForm = new FormGroup({
    display_units_eui: new FormControl('', [Validators.required]),
    display_units_ghg: new FormControl('', [Validators.required]),
    display_units_ghg_intensity: new FormControl('', [Validators.required]),
    display_units_water_use: new FormControl('', [Validators.required]),
    display_units_wui: new FormControl('', [Validators.required]),
    display_units_area: new FormControl('', [Validators.required]),
    display_decimal_places: new FormControl(0, [Validators.required]),
    thermal_conversion_assumption: new FormControl(1, [Validators.min(1), Validators.max(2)]),
  })

  ngOnInit(): void {
    this._organizationService.currentOrganization$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((organization) => {
      this.organization = organization
      for (const field of Object.keys(this.unitsForm.controls)) {
        this.unitsForm.get(field).setValue(this.organization[field])
      }
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  submit(): void {
    if (this.unitsForm.valid) {
      this.organization.display_units_eui = this.unitsForm.get('display_units_eui').value
      this.organization.display_units_ghg = this.unitsForm.get('display_units_ghg').value
      this.organization.display_units_ghg_intensity = this.unitsForm.get('display_units_ghg_intensity').value
      this.organization.display_units_water_use = this.unitsForm.get('display_units_water_use').value
      this.organization.display_units_wui = this.unitsForm.get('display_units_wui').value
      this.organization.display_units_area = this.unitsForm.get('display_units_area').value
      this.organization.display_decimal_places = this.unitsForm.get('display_decimal_places').value
      this.organization.thermal_conversion_assumption = this.unitsForm.get('thermal_conversion_assumption').value
      this._organizationService.updateSettings(this.organization).subscribe()
    }
  }
}
