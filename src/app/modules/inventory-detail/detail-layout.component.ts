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
  displayName = this.type === 'taxlots' ? 'Tax Lot' : 'Property'

  analyses: NavigationItem = {
    id: `properties/${this.id}}/analyses`,
    link: `/properties/${this.id}/analyses`,
    exactMatch: true,
    title: 'Analyses',
    type: 'basic',
  }

  detail: NavigationItem = {
    id: `${this.type}/${this.id}}/`,
    link: `/${this.type}/${this.id}/`,
    exactMatch: true,
    title: 'Detail',
    type: 'basic',
  }

  columnDetailProfiles: NavigationItem = {
    id: `${this.type}/${this.id}/column-detail-profiles`,
    link: `/${this.type}/${this.id}/column-detail-profiles`,
    title: 'Column Detail Profiles',
    type: 'basic',
  }

  crossCycles: NavigationItem = {
    id: `${this.type}/${this.id}/cross-cycles`,
    link: `/${this.type}/${this.id}/cross-cycles`,
    title: 'Cross Cycles',
    type: 'basic',
  }

  meters: NavigationItem = {
    id: `properties/${this.id}}/meters`,
    link: `/properties/${this.id}/meters`,
    exactMatch: true,
    title: 'Meters',
    type: 'basic',
  }

  notes: NavigationItem = {
    id: `${this.type}/${this.id}/notes`,
    link: `/${this.type}/${this.id}/notes`,
    title: 'Notes',
    type: 'basic',
  }

  sensors: NavigationItem = {
    id: `properties/${this.id}}/sensors`,
    link: `/properties/${this.id}/sensors`,
    exactMatch: true,
    title: 'Sensors',
    type: 'basic',
  }

  timeline: NavigationItem = {
    id: `properties/${this.id}}/timeline`,
    link: `/properties/${this.id}/timeline`,
    exactMatch: true,
    title: 'Timeline',
    type: 'basic',
  }

  ubids: NavigationItem = {
    id: `${this.type}/${this.id}}/ubids`,
    link: `/${this.type}/${this.id}/ubids`,
    exactMatch: true,
    title: 'UBIDs',
    type: 'basic',
  }

  propertyChildren: NavigationItem[] = [
    this.detail,
    this.analyses,
    this.columnDetailProfiles,
    this.crossCycles,
    this.meters,
    this.notes,
    this.sensors,
    this.timeline,
    this.ubids,
  ]

  taxlotChildren: NavigationItem[] = [
    this.detail,
    this.columnDetailProfiles,
    this.crossCycles,
    this.notes,
    this.ubids,
  ]

  readonly detailNavigationMenu: NavigationItem[] = [
    {
      id: `${this.type}/detail`,
      title: this.displayName,
      type: 'group',
      children: this.type === 'taxlots' ? this.taxlotChildren : this.propertyChildren,
    },
  ]

  ngAfterViewInit() {
    this._drawerService.setDrawer(this.drawer)
  }
}
