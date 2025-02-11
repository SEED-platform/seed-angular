import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { OrganizationService, type OrganizationUser, type OrganizationUsers } from '@seed/api/organization'
import { PageComponent, TableContainerComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-organizations-members',
  templateUrl: './members.component.html',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTableModule,
    PageComponent,
    SharedImports,
    TableContainerComponent,
  ],
})
export class MembersComponent implements OnInit {
  private _organizationService = inject(OrganizationService)
  members: OrganizationUsers
  orgId: number
  membersDataSource = new MatTableDataSource<OrganizationUser>([])
  membersColumns = ['name', 'email', 'access level', 'access level instance', 'role', 'actions']

  ngOnInit(): void {
    this.getMembers()
  }

  getMembers(): void {
    // subscribe to current org stream and fetch org users
    this._organizationService.currentOrganization$.subscribe(({ org_id }) => {
      this._organizationService.getOrganizationUsers(org_id)
      this.orgId = org_id
    })

    // subscribe to org users stream and set members
    this._organizationService.organizationUsers$.subscribe((orgUsers) => {
      this.members = orgUsers
      this.membersDataSource.data = orgUsers
      console.log(orgUsers)
    })
  }

  editMember(member: OrganizationUser): void {
    console.log('edit member', member)
  }

  deleteMember(member: OrganizationUser): void {
    console.log('delete members', member)
  }

  trackByFn(_index: number, { email }: OrganizationUser) {
    return email
  }
}
