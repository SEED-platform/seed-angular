import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatDividerModule } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { Subject, takeUntil } from 'rxjs'
import type { Column } from '@seed/api/column'
import { ColumnService } from '@seed/api/column'
import type { Organization } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import { PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { naturalSort } from '@seed/utils'

@Component({
  selector: 'seed-organizations-settings-display-fields',
  templateUrl: './display-fields.component.html',
  imports: [
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    PageComponent,
    ReactiveFormsModule,
    SharedImports,
  ],
})
export class DisplayFieldsComponent implements OnDestroy, OnInit {
  private _organizationService = inject(OrganizationService)
  private _columnService = inject(ColumnService)

  private readonly _unsubscribeAll$ = new Subject<void>()
  organization: Organization
  propertyColumns: Column[]
  taxLotColumns: Column[]
  xAxisColumns: Column[]
  yAxisColumns: Column[]
  defaultDisplayFieldsForm = new FormGroup({
    property_display_field: new FormControl('address_line_1'),
    taxlot_display_field: new FormControl('address_line_1'),
    default_reports_x_axis_options: new FormControl([]),
    default_reports_y_axis_options: new FormControl([]),
  })

  ngOnInit(): void {
    this._organizationService.currentOrganization$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((organization) => {
      this.organization = organization
      this.defaultDisplayFieldsForm.get('property_display_field').setValue(this.organization.property_display_field)
      this.defaultDisplayFieldsForm.get('taxlot_display_field').setValue(this.organization.taxlot_display_field)
      this.defaultDisplayFieldsForm
        .get('default_reports_x_axis_options')
        .setValue(this.organization.default_reports_x_axis_options.map((c) => c.id))
      this.defaultDisplayFieldsForm
        .get('default_reports_y_axis_options')
        .setValue(this.organization.default_reports_y_axis_options.map((c) => c.id))
    })
    this._columnService.propertyColumns$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((propertyColumns) => {
      this.propertyColumns = propertyColumns
      this.xAxisColumns = propertyColumns
        .filter((c) => !c.related && !c.pinnedLeft)
        .sort((a, b) => naturalSort(a.display_name, b.display_name))
      this.yAxisColumns = this.xAxisColumns
        .filter((c) => ['area', 'eui', 'float', 'integer', 'number'].includes(c.data_type) || c.derived_column)
        .sort((a, b) => naturalSort(a.display_name, b.display_name))
    })
    this._columnService.taxLotColumns$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((taxLotColumns) => {
      this.taxLotColumns = taxLotColumns
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  submit(): void {
    if (this.defaultDisplayFieldsForm.valid) {
      this.organization.property_display_field = this.defaultDisplayFieldsForm.get('property_display_field').value
      this.organization.taxlot_display_field = this.defaultDisplayFieldsForm.get('taxlot_display_field').value
      this.organization.default_reports_x_axis_options = this.propertyColumns.filter((c) =>
        this.defaultDisplayFieldsForm.get('default_reports_x_axis_options').value.includes(c.id),
      )
      this.organization.default_reports_y_axis_options = this.propertyColumns.filter((c) =>
        this.defaultDisplayFieldsForm.get('default_reports_y_axis_options').value.includes(c.id),
      )
      this._organizationService.updateSettings(this.organization).subscribe()
    }
  }
}
