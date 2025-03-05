import { AsyncPipe } from '@angular/common'
import { Component, inject } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { OrganizationService } from '@seed/api/organization'

@Component({
  selector: 'seed-organizations-settings-maintenance',
  templateUrl: './maintenance.component.html',
  imports: [AsyncPipe, MatIconModule],
})
export class MaintenanceComponent {
  private _organizationService = inject(OrganizationService)
  organization$ = this._organizationService.currentOrganization$
}
