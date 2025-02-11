import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { OrganizationService } from '@seed/api/organization'
import { PageComponent, TableContainerComponent } from '@seed/components'

@Component({
  selector: 'seed-organizations-members',
  templateUrl: './members.component.html',
  imports: [PageComponent, TableContainerComponent],
})
export class MembersComponent implements OnInit {
  members = [{ name: 'aaa' }, { name: 'bbb' }, { name: 'ccc' }]
  private _organizationService = inject(OrganizationService)
  ngOnInit(): void {
    console.log('organizations members')
    this.getMembers()
  }

  getMembers(): void {
    this._organizationService.getOrganizationUsers()
  }
}
