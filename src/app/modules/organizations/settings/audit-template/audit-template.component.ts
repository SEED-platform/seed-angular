import { CommonModule } from '@angular/common'
import { type OnDestroy, type OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButton } from '@angular/material/button'
import { MatCheckbox } from '@angular/material/checkbox'
import { MatDivider } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { Subject, takeUntil } from 'rxjs'
import { type AuditTemplateReportType, AuditTemplateService } from '@seed/api/audit-template'
import { type Organization, OrganizationService } from '@seed/api/organization'
import { PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { SnackbarService } from 'app/core/snackbar/snackbar.service'

@Component({
  selector: 'seed-organizations-settings-audit-template',
  templateUrl: './audit-template.component.html',
  imports: [
    CommonModule,
    SharedImports,
    MatButton,
    MatCheckbox,
    MatDivider,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    PageComponent],
})
export class AuditTemplateComponent implements OnDestroy, OnInit {
  private _organizationService = inject(OrganizationService)
  private _auditTemplateService = inject(AuditTemplateService)
  private _snackBar = inject(SnackbarService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  organization: Organization
  auditTemplateReportTypes: AuditTemplateReportType[]
  auditTemplateForm = new FormGroup({
    at_organization_token: new FormControl(''),
    audit_template_user: new FormControl('', [Validators.email]),
    audit_template_password: new FormControl(''),
    audit_template_city_id: new FormControl(),
    status_complies: new FormControl(false),
    status_pending: new FormControl(false),
    status_received: new FormControl(false),
    status_rejected: new FormControl(false),
    audit_template_conditional_import: new FormControl(false),
    audit_template_sync_enabled: new FormControl(false),
    audit_template_report_type: new FormControl(''),
  })
  status_fields = [
    { key: 'Complies', field: 'status_complies' },
    { key: 'Pending', field: 'status_pending' },
    { key: 'Received', field: 'status_received' },
    { key: 'Rejected', field: 'status_rejected' },
  ]
  passwordHidden = true

  ngOnInit(): void {
    this._organizationService.currentOrganization$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((organization) => {
      this.organization = organization
      this.auditTemplateForm.get('at_organization_token').setValue(this.organization.at_organization_token)
      this.auditTemplateForm.get('audit_template_user').setValue(this.organization.audit_template_user)
      this.auditTemplateForm.get('audit_template_city_id').setValue(this.organization.audit_template_city_id)
      this.auditTemplateForm.get('audit_template_password').setValue(this.organization.audit_template_password)
      this.auditTemplateForm.get('audit_template_sync_enabled').setValue(this.organization.audit_template_sync_enabled)
      this.auditTemplateForm.get('audit_template_report_type').setValue(this.organization.audit_template_report_type)
      this.auditTemplateForm.get('audit_template_conditional_import').setValue(this.organization.audit_template_conditional_import)
      for (const field of this.status_fields) {
        this.auditTemplateForm.get(field.field).setValue(this.organization.audit_template_status_types.includes(field.key))
      }
    })
    this._auditTemplateService.reportTypes$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((types) => {
      this.auditTemplateReportTypes = types
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  togglePassword(): void {
    this.passwordHidden = !this.passwordHidden
  }

  importSubmissions(): void {
    // TODO - Build out import wizard
    console.log('Not implemented')
    this._snackBar.warning('Not implemented')
  }

  submit(): void {
    if (this.auditTemplateForm.valid) {
      this.organization.at_organization_token = this.auditTemplateForm.get('at_organization_token').value
      this.organization.audit_template_user = this.auditTemplateForm.get('audit_template_user').value
      this.organization.audit_template_city_id = this.auditTemplateForm.get('audit_template_city_id').value as number
      this.organization.audit_template_password = this.auditTemplateForm.get('audit_template_password').value
      this.organization.audit_template_sync_enabled = this.auditTemplateForm.get('audit_template_sync_enabled').value
      this.organization.audit_template_report_type = this.auditTemplateForm.get('audit_template_report_type').value
      this.organization.audit_template_conditional_import = this.auditTemplateForm.get('audit_template_conditional_import').value

      this.organization.audit_template_status_types = this.status_fields.filter((f) => this.auditTemplateForm.get(f.field).value === true).map((f) => f.key).join(',')
      this._organizationService.updateSettings(this.organization).subscribe()
    }
  }
}
