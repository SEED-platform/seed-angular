import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { OrganizationService } from '@seed/api/organization'
import { PageComponent } from '../../../../../@seed/components'

@Component({
  selector: 'seed-organizations-settings-maintenance',
  templateUrl: './maintenance.component.html',
  imports: [CommonModule, MatIconModule, PageComponent],
})
export class MaintenanceComponent {
  private _organizationService = inject(OrganizationService)
  organization$ = this._organizationService.currentOrganization$
}
