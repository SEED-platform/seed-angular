import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { OrganizationService } from '@seed/api/organization'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-organizations-settings-salesforce',
  templateUrl: './salesforce.component.html',
  imports: [CommonModule, SharedImports, MatIconModule],
})
export class SalesforceComponent {
  private _organizationService = inject(OrganizationService)
  organization$ = this._organizationService.currentOrganization$
}
