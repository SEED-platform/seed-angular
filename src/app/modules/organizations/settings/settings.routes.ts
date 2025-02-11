import type { Routes } from '@angular/router'
import { APIKeyComponent } from './api-key/api-key.component'
import { AuditTemplateComponent } from './audit-template/audit-template.component'
import { DefaultDisplayFieldComponent } from './default-display-fields/default-display-fields.component'
import { EmailComponent } from './email/email.component'
import { MaintenanceComponent } from './maintenance/maintenance.component'
import { OptionsComponent } from './options/options.component'
import { SalesforceComponent } from './salesforce/salesforce.component'
import { TwoFactorComponent } from './two-factor/two-factor.component'
import { UBIDComponent } from './ubid/ubid.component'
import { UnitsComponent } from './units/units.component'

export default [
  {
    path: 'options',
    title: 'Basic Organization Settings',
    component: OptionsComponent,
  },
  {
    path: 'api-key',
    title: 'Organizations API Keys',
    component: APIKeyComponent,
  },
  {
    path: 'audit-template',
    title: 'Organization Audit Template Settings',
    component: AuditTemplateComponent,
  },
  {
    path: 'default-display-fields',
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
    path: 'two-factor',
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
