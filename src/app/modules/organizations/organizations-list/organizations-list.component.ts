import { CommonModule } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatTableModule } from '@angular/material/table'
import { Router, RouterLink } from '@angular/router'
import { OrganizationsService } from '../organizations.service'
import type { OrganizationsList } from '../organizations.types'

@Component({
  selector: 'seed-organizations-list',
  templateUrl: './organizations-list.component.html',
  styleUrl: './organizations-list.component.scss',
  imports: [CommonModule, MatButtonModule, MatTableModule, RouterLink],
})
export class OrganizationsListComponent implements OnInit {
  private _router = inject(Router)
  private _organizationsService = inject(OrganizationsService)
  public organizations: OrganizationsList = []

  columns = [
    { key: 'name', label: 'Organization Name' },
    { key: 'numProperties', label: 'Number of Properties' },
    { key: 'numTaxLots', label: 'Number of Tax Lots' },
    { key: 'role', label: 'Your Role' },
    { key: 'owners', label: 'Organization Owners' },
  ]

  get displayedColumns(): string[] {
    return this.columns.map((column) => column.key)
  }

  ngOnInit(): void {
    console.log('organizations list')
    this._organizationsService.getOrganizations().subscribe({
      next: (data: OrganizationsList) => {
        this.organizations = data
      },
      error: (err) => {
        console.log('Error getting organizations', err)
      },
    })
  }

  setOrg(orgId: number) {
    this._organizationsService.setOrg(this.organizations.find((org) => org.id === orgId))
  }
}
