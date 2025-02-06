import type { Routes } from '@angular/router'
import { APIKeyComponent } from './api_key/api_key.component'
import { AuditTemplateComponent } from './audit_template/audit_template.component'
import { DefaultDisplayFieldComponent } from './default_display_fields/default_display_fields.component'
import { EmailComponent } from './email/email.component'
import { MaintenanceComponent } from './maintenance/maintenance.component'
import { OptionsComponent } from './options/options.component'
import { SalesforceComponent } from './salesforce/salesforce.component'
import { TwoFactorComponent } from './two_factor/two_factor.component'
import { UBIDComponent } from './ubid/ubid.component'
import { UnitsComponent } from './units/units.component'

export default [
  {
    path: 'options',
    title: 'Basic Organization Settings',
    component: OptionsComponent,
  },
  {
    path: 'api_key',
    title: 'Organizations API Keys',
    component: APIKeyComponent,
  },
  {
    path: 'audit_template',
    title: 'Organization Audit Template Settings',
    component: AuditTemplateComponent,
  },
  {
    path: 'default_display_fields',
    title: 'Default Display Field Settings',
    component: DefaultDisplayFieldComponent,
  },
  {
    path: 'email',
    title: 'New User Email Settings',
    component: EmailComponent,
  },
  {
    path: 'maintenance',
    title: 'Organization Maintenance Actions',
    component: MaintenanceComponent,
  },
  {
    path: 'salesforce',
    title: 'Salesforce Integration',
    component: SalesforceComponent,
  },
  {
    path: 'two_factor',
    title: 'Two Factor Authentication Settings',
    component: TwoFactorComponent,
  },
  {
    path: 'ubid',
    title: 'UBID Threshold Setting',
    component: UBIDComponent,
  },
  {
    path: 'units',
    title: 'Display Unit Settings',
    component: UnitsComponent,
  },
] satisfies Routes
