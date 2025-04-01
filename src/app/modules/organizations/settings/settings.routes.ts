import type { Routes } from '@angular/router'
import { ApiKeysComponent } from './api-keys/api-keys.component'
import { AuditTemplateComponent } from './audit-template/audit-template.component'
import { DisplayFieldsComponent } from './display-fields/display-fields.component'
import { DisplayUnitsComponent } from './display-units/display-units.component'
import { EmailComponent } from './email/email.component'
import { MaintenanceComponent } from './maintenance/maintenance.component'
import { OptionsComponent } from './options/options.component'
import { SalesforceComponent } from './salesforce/salesforce.component'
import { TwoFactorComponent } from './two-factor/two-factor.component'
import { UBIDComponent } from './ubid/ubid.component'

export default [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'options',
  },
  {
    path: 'options',
    title: 'Options',
    component: OptionsComponent,
  },
  {
    path: 'api-keys',
    title: 'API Keys',
    component: ApiKeysComponent,
  },
  {
    path: 'audit-template',
    title: 'Audit Template',
    component: AuditTemplateComponent,
  },
  {
    path: 'display-fields',
    title: 'Display Fields',
    component: DisplayFieldsComponent,
  },
  {
    path: 'display-units',
    title: 'Display Units',
    component: DisplayUnitsComponent,
  },
  {
    path: 'email',
    title: 'Email',
    component: EmailComponent,
  },
  {
    path: 'maintenance',
    title: 'Maintenance',
    component: MaintenanceComponent,
  },
  {
    path: 'salesforce',
    title: 'Salesforce Integration',
    component: SalesforceComponent,
  },
  {
    path: 'two-factor',
    title: 'Two-Factor Authentication',
    component: TwoFactorComponent,
  },
  {
    path: 'ubid',
    title: 'UBID',
    component: UBIDComponent,
  },
] satisfies Routes
