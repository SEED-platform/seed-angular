import { CommonModule } from '@angular/common'
import { Component, inject, type OnDestroy, type OnInit } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButton } from '@angular/material/button'
import { MatDivider } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { Subject, takeUntil } from 'rxjs'
import { type Organization, OrganizationService } from '@seed/api/organization'
import { type SalesforceConfig, type SalesforceMapping, SalesforceService } from '@seed/api/salesforce'
import { PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-organizations-settings-salesforce',
  templateUrl: './salesforce.component.html',
  imports: [CommonModule, SharedImports, MatButton, MatDivider, MatFormFieldModule, MatIconModule, MatInputModule, MatSlideToggleModule, ReactiveFormsModule, PageComponent],
})
export class SalesforceComponent implements OnDestroy, OnInit {
  private _organizationService = inject(OrganizationService)
  private _salesforceService = inject(SalesforceService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  betterVerifiedIcon = ''
  betterVerifiedIconColor = 'primary'
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
      logging_email: new FormControl(''),
      benchmark_contact_fieldname: new FormControl(''),
      data_admin_email_column: new FormControl(0),
      data_admin_name_column: new FormControl(0),
      data_admin_account_name_column: new FormControl(0),
      default_data_admin_account_name: new FormControl(''),
      data_admin_contact_fieldname: new FormControl(0),
      update_at_hour: new FormControl(0),
      update_at_minute: new FormControl(0),
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
      // this.salesforceForm.get('salesforceConfig.username').setValue(this.salesforceConfig.username)
      // this.salesforceForm.get('salesforceConfig.password').setValue(this.salesforceConfig.password)
      // this.salesforceForm.get('salesforceConfig.security_token').setValue(this.salesforceConfig.security_token)
      // this.salesforceForm.get('salesforceConfig.domain').setValue(this.salesforceConfig.domain)
      // this.salesforceForm.get('salesforceConfig.update_at_hour').setValue(this.salesforceConfig.update_at_hour)
      // this.salesforceForm.get('salesforceConfig.indication_label').setValue(this.salesforceConfig.indication_label)
      // this.salesforceForm.get('salesforceConfig.violation_label').setValue(this.salesforceConfig.violation_label)
      // this.salesforceForm.get('salesforceConfig.compliance_label').setValue(this.salesforceConfig.compliance_label)
      // this.salesforceForm.get('salesforceConfig.delete_label_after_sync').setValue(this.salesforceConfig.delete_label_after_sync)
      // this.salesforceForm.get('salesforceConfig.benchmark_contact_fieldname').setValue(this.salesforceConfig.benchmark_contact_fieldname)
      // this.salesforceForm.get('salesforceConfig.logging_email').setValue(this.salesforceConfig.logging_email)
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  submit(): void {
    if (this.salesforceForm.valid) {
      this._organizationService.updateSettings(this.organization).subscribe()
    }
  }
}
