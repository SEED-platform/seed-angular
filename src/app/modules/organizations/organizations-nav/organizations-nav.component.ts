import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { MatTabsModule } from '@angular/material/tabs'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import type { InventoryType } from '../../inventory/inventory.types'
import { OrganizationsService } from '../organizations.service'
import type { Organization } from '../organizations.types'

@Component({
  selector: 'seed-organizations-nav',
  templateUrl: './organizations-nav.component.html',
  imports: [
    MatTabsModule,
    RouterModule,
    MatIconModule,
  ],
})
export class OrganizationsNavComponent implements OnInit {
  private _organizationsService = inject(OrganizationsService)
  private _router = inject(Router)
  private _route = inject(ActivatedRoute)
  private _defaultLink = { base: '', path: './', title: 'Settings', icon: 'fa-solid:gears' }
  type = this._route.snapshot.paramMap.get('type') as InventoryType

  activeLink = this._defaultLink
  organization!: Organization

  links = [
    { base: 'access-level-tree', path: 'access-level-tree', title: 'Access Level Tree', icon: 'fa-solid:sitemap' },
    { base: 'column-mappings', path: 'column-mappings/properties', title: 'Column mappings', icon: 'fa-solid:sitemap' },
    { base: 'column-settings', path: 'column-settings/properties', title: 'Column Settings', icon: 'fa-solid:sliders' },
    { base: 'cycles', path: 'cycles', title: 'Cycles', icon: 'fa-solid:calendar-days' },
    { base: 'data-quality', path: 'data-quality/properties', title: 'Data Quality', icon: 'fa-solid:flag' },
    { base: 'derived-columns', path: 'derived-columns/properties', title: 'Derived Columns', icon: 'fa-solid:calculator' },
    { base: 'email-templates', path: 'email-templates', title: 'Email Templates', icon: 'fa-solid:envelope' },
    { base: 'labels', path: 'labels', title: 'Labels', icon: 'fa-solid:tags' },
    { base: 'member', path: 'members', title: 'Members', icon: 'fa-solid:user' },
    this._defaultLink,
  ]

  ngOnInit(): void {
    console.log('type', this.type)
    this.organization = this._organizationsService.getOrg()
    // split url segments will follow this pattern ['', 'organizations', 'organizationId', 'base']
    const base = this._router.url.split('/')[3]
    this.activeLink = this.links.find((link) => link.base === base) || this._defaultLink
  }
}
