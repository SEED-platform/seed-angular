import { CommonModule } from '@angular/common'
import { Component, inject, type OnDestroy, type OnInit } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButton } from '@angular/material/button'
import { MatDivider } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { Subject, takeUntil } from 'rxjs'
import { type Column, ColumnService } from '@seed/api/column'
import { type Label, LabelService } from '@seed/api/label'
import { type Organization, OrganizationService } from '@seed/api/organization'
import { type SalesforceConfig, type SalesforceMapping, SalesforceService } from '@seed/api/salesforce'
import { PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { naturalSort } from '@seed/utils'
import { RouteConfigLoadEnd } from '@angular/router'

@Component({
  selector: 'seed-organizations-settings-salesforce',
  templateUrl: './salesforce.component.html',
  imports: [CommonModule, SharedImports, MatButton, MatDivider, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatSlideToggleModule, ReactiveFormsModule, PageComponent],
})
export class SalesforceComponent implements OnDestroy, OnInit {
  private _organizationService = inject(OrganizationService)
  private _salesforceService = inject(SalesforceService)
  private _labelService = inject(LabelService)
  private _columnService = inject(ColumnService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  passwordHidden = true
  tokenHidden = true
  labels: Label[]
  columns: Column[]
  organization: Organization
  salesforceConfig: SalesforceConfig
  salesforceMappings: SalesforceMapping[]
  salesforceForm = new FormGroup({
    salesforce_enabled: new FormControl(false),
    salesforceConfig: new FormGroup({
      id: new FormControl(0),
      organization_id: new FormControl(0),
      indication_label: new FormControl(0),
      violation_label: new FormControl(0),
      compliance_label: new FormControl(0),
      account_rec_type: new FormControl(''),
      contact_rec_type: new FormControl(''),
      last_update_date: new FormControl(''),
      unique_benchmark_id_fieldname: new FormControl(''),
      seed_benchmark_id_column: new FormControl(''),
      url: new FormControl(''),
      username: new FormControl(''),
      password: new FormControl(''),
      security_token: new FormControl(''),
      domain: new FormControl(''),
      cycle_fieldname: new FormControl(''),
      status_fieldname: new FormControl(''),
      labels_fieldname: new FormControl(''),
      contact_email_column: new FormControl(0),
      contact_name_column: new FormControl(0),
      account_name_column: new FormControl(0),
      default_contact_account_name: new FormControl(''),
      logging_email: new FormControl('', [Validators.email]),
      benchmark_contact_fieldname: new FormControl(''),
      data_admin_email_column: new FormControl(0),
      data_admin_name_column: new FormControl(0),
      data_admin_account_name_column: new FormControl(0),
      default_data_admin_account_name: new FormControl(''),
      data_admin_contact_fieldname: new FormControl(0),
      update_at_hour: new FormControl(0, [Validators.min(0), Validators.max(23)]),
      update_at_minute: new FormControl(0, [Validators.min(0), Validators.max(59)]),
      delete_label_after_sync: new FormControl(false),
    }),
  })

  ngOnInit(): void {
    this._organizationService.currentOrganization$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((organization) => {
      this.organization = organization
      this.salesforceForm.get('salesforce_enabled').setValue(this.organization.salesforce_enabled)
    })
    this._salesforceService.config$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((config) => {
      this.salesforceConfig = config
      for (const field of Object.keys(config)) {
        const key = `salesforceConfig.${field}`
        if (this.salesforceForm.get(key)) {
          this.salesforceForm.get(key).patchValue(config[field])
        }
      }
    })
    this._salesforceService.mappings$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((mappings) => {
      this.salesforceMappings = mappings
    })
    this._labelService.labels$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((labels) => {
      this.labels = labels
    })
    this._columnService.propertyColumns$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((columns) => {
      this.columns = columns.sort((a, b) => naturalSort(a.display_name, b.display_name))
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  togglePassword(): void {
    this.passwordHidden = !this.passwordHidden
  }

  toggleToken(): void {
    this.tokenHidden = !this.tokenHidden
  }

  resetUpdateDate(): void {
    console.log('Need to build this')
  }

  toggleForm(): void {
    const enabled = this.salesforceForm.get('salesforce_enabled').value
    const fg = this.salesforceForm.get('salesforceConfig') as FormGroup
    for (const field of Object.keys(fg.controls)) {
      if (enabled) {
        this.salesforceForm.get(`salesforceConfig.${field}`).enable()
      } else {
        this.salesforceForm.get(`salesforceConfig.${field}`).disable()
      }
    }
  }

  submit(): void {
    if (this.salesforceForm.valid) {
      this.organization.salesforce_enabled = this.salesforceForm.get('salesforce_enabled').value
      for (const field of Object.keys(this.salesforceConfig)) {
        this.salesforceConfig[field] = this.salesforceForm.get(`salesforceConfig.${field}`).value
      }
      this._organizationService.updateSettings(this.organization).subscribe()
      this._salesforceService.update(this.organization.id, this.salesforceConfig).subscribe((config) => {
        this.salesforceConfig = config
      })
    }
  }
}
