import { Component, ViewEncapsulation } from '@angular/core'
import { MatSidenavModule } from '@angular/material/sidenav'
import { RouterOutlet } from '@angular/router'
import type { NavigationItem } from '@seed/components'
import { VerticalNavigationComponent } from '@seed/components'
import { ScrollResetDirective } from '@seed/directives'

@Component({
  selector: 'seed-organizations',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [MatSidenavModule, RouterOutlet, ScrollResetDirective, VerticalNavigationComponent],
})
export class SettingsComponent {
  readonly settingsNavigationMenu: NavigationItem[] = [
    {
      id: 'organizations/settings',
      title: 'Settings',
      type: 'group',
      children: [
        {
          id: 'organizations/settings/options',
          link: '/organizations/settings/options',
          title: 'Options',
          type: 'basic',
        },
        {
          id: 'organizations/settings/api-keys',
          link: '/organizations/settings/api-keys',
          title: 'API Keys',
          type: 'basic',
        },
        {
          id: 'organizations/settings/audit-template',
          link: '/organizations/settings/audit-template',
          title: 'Audit Template',
          type: 'basic',
        },
        {
          id: 'organizations/settings/display-fields',
          link: '/organizations/settings/display-fields',
          title: 'Display Fields',
          type: 'basic',
        },
        {
          id: 'organizations/settings/display-units',
          link: '/organizations/settings/display-units',
          title: 'Display Units',
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
          title: 'Salesforce Integration',
          type: 'basic',
        },
        {
          id: 'organizations/settings/two-factor',
          link: '/organizations/settings/two-factor',
          title: 'Two-Factor Authentication',
          type: 'basic',
        },
        {
          id: 'organizations/settings/ubid',
          link: '/organizations/settings/ubid',
          title: 'UBID',
          type: 'basic',
        },
      ],
    },
  ]
}
