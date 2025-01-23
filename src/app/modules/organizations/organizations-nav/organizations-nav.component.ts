import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { MatTabsModule } from '@angular/material/tabs'
import { Router, RouterModule } from '@angular/router'
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
  private _defaultLink = { path: './', title: 'Settings', icon: 'fa-solid:gears' }
  activeLink = this._defaultLink
  organization!: Organization

  links = [
    { path: 'access-level-tree', title: 'Access Level Tree', icon: 'fa-solid:sitemap' },
    { path: 'cycles', title: 'Cycles', icon: 'fa-solid:calendar-days' },
    { path: 'email-templates', title: 'Email Templates', icon: 'fa-solid:envelope' },
    { path: 'labels', title: 'Labels', icon: 'fa-solid:tags' },
    { path: 'members', title: 'Members', icon: 'fa-solid:user' },
    this._defaultLink,
  ]

  ngOnInit(): void {
    console.log('organizations nav')
    this.organization = this._organizationsService.getOrg()
    const currentPath = this._router.url.split('/').pop()
    this.activeLink = this.links.find((link) => link.path === currentPath) || this._defaultLink
  }
}
