import { CommonModule, NgIf } from '@angular/common'
import { Component, inject } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { OrganizationService } from '@seed/api/organization'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-organizations-settings',
  templateUrl: './organizations-settings.component.html',
  imports: [CommonModule, SharedImports, MatIconModule, NgIf],
})
export class OrganizationsSettingsComponent {
  private _organizationService = inject(OrganizationService)
  organization$ = this._organizationService.currentOrganization$
}
