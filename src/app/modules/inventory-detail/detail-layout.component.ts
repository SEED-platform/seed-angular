import type { AfterViewInit } from '@angular/core'
import { Component, inject, ViewChild } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import type { MatDrawer } from '@angular/material/sidenav'
import { MatSidenavModule } from '@angular/material/sidenav'
import { ActivatedRoute, RouterOutlet } from '@angular/router'
import type { NavigationItem } from '@seed/components'
import { DrawerService, VerticalNavigationComponent } from '@seed/components'
import { ScrollResetDirective } from '@seed/directives'
import type { InventoryType } from '../inventory/inventory.types'

@Component({
  selector: 'seed-inventory-detail-layout',
  templateUrl: './detail-layout.component.html',
  imports: [
    MatIconModule,
    MatSidenavModule,
    RouterOutlet,
    ScrollResetDirective,
    VerticalNavigationComponent,
  ],
})
export class DetailLayoutComponent implements AfterViewInit {
  @ViewChild('drawer') drawer!: MatDrawer
  private _drawerService = inject(DrawerService)
  private _activatedRoute = inject(ActivatedRoute)
  id = this._activatedRoute.snapshot.paramMap.get('id')
  type = this._activatedRoute.snapshot.paramMap.get('type') as InventoryType
  typeMap = {
    properties: {
      displayName: 'Property',
    },
    taxlots: {
      displayName: 'Tax Lot',
    },
  }

  readonly detailNavigationMenu: NavigationItem[] = [
    {
      id: 'property/detail',
      title: this.typeMap[this.type].displayName,
      type: 'group',
      children: [
        {
          id: `properties/${this.id}}/`,
          link: `/properties/${this.id}/`,
          exactMatch: true,
          title: 'Detail',
          type: 'basic',
        },
        {
          id: `properties/${this.id}/meters`,
          link: `/properties/${this.id}/meters`,
          title: 'Meters',
          type: 'basic',
        },
        {
          id: `properties/${this.id}/notes`,
          link: `/properties/${this.id}/notes`,
          title: 'Notes',
          type: 'basic',
        },
      ],
    },
  ]

  ngAfterViewInit() {
    this._drawerService.setDrawer(this.drawer)
  }
}
