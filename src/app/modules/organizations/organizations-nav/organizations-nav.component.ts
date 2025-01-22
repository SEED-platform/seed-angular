import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatTabsModule } from '@angular/material/tabs'
import { Router, RouterModule } from '@angular/router'

@Component({
  selector: 'seed-organizations-nav',
  templateUrl: './organizations-nav.component.html',
  imports: [
    MatTabsModule,
    RouterModule,
  ],
})
export class OrganizationsNavComponent implements OnInit {
  private _router = inject(Router)

  links = [
    { path: './', title: 'Settings' },
    { path: 'cycles', title: 'Cycles' },
    { path: 'labels', title: 'Labels' },
    { path: 'access-level-tree', title: 'Access Level Tree' },
  ]
  activeLink = this.links[0]

  ngOnInit(): void {
    console.log('organizations nav')
    const currentPath = this._router.url.split('/').pop()
    this.activeLink = this.links.find((link) => link.path === currentPath) || this.links[0]
  }
}
