import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { MatSidenavModule } from '@angular/material/sidenav'
import { RouterOutlet } from '@angular/router'
import { type NavigationItem, VerticalNavigationComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-organizations',
  templateUrl: './settings.component.html',
  imports: [CommonModule, SharedImports, MatIconModule, MatSidenavModule, VerticalNavigationComponent, RouterOutlet],
})
export class SettingsComponent {
  settingsNavigationMenu: NavigationItem[] = [
    {
      id: 'organizations/settings/options',
      link: '/organizations/settings/options',
      title: 'Options',
      type: 'basic',
    },
    {
      id: 'organizations/settings/api-key',
      link: '/organizations/settings/api-key',
      title: 'API Key',
      type: 'basic',
    },
    {
      id: 'organizations/settings/audit-template',
      link: '/organizations/settings/audit-template',
      title: 'Audit Template',
      type: 'basic',
    },
    {
      id: 'organizations/settings/default-display-fields',
      link: '/organizations/settings/default-display-fields',
      title: 'Default Display Fields',
      type: 'basic',
    },
    {
      id: 'organizations/settings/email',
      link: '/organizations/settings/email',
      title: 'Email',
      type: 'basic',
    },
    {
      id: 'organizations/settings/maintenance',
      link: '/organizations/settings/maintenance',
      title: 'Maintenance',
      type: 'basic',
    },
    {
      id: 'organizations/settings/salesforce',
      link: '/organizations/settings/salesforce',
      title: 'Salesforce',
      type: 'basic',
    },
    {
      id: 'organizations/settings/two-factor',
      link: '/organizations/settings/two-factor',
      title: 'Two Factor Authentication',
      type: 'basic',
    },
    {
      id: 'organizations/settings/ubid',
      link: '/organizations/settings/ubid',
      title: 'UBID',
      type: 'basic',
    },
    {
      id: 'organizations/settings/units',
      link: '/organizations/settings/units',
      title: 'Units',
      type: 'basic',
    },
  ]
}
