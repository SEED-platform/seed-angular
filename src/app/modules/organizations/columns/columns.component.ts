import { CommonModule, Location } from '@angular/common'
import { Component, inject, type OnInit } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatTabsModule } from '@angular/material/tabs'
import { Title } from '@angular/platform-browser'
import { Router, RouterOutlet } from '@angular/router'
import { type NavigationItem, VerticalNavigationComponent } from '@seed/components'
import { PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-organizations-columns',
  templateUrl: './columns.component.html',
  imports: [CommonModule, SharedImports, MatIconModule, MatSidenavModule, MatTabsModule, PageComponent, VerticalNavigationComponent, RouterOutlet],
})
export class ColumnsComponent implements OnInit {
  private _title = inject(Title)
  private _router = inject(Router)
  private _location = inject(Location)
  tabs = [
    {
      label: 'Properties',
      route: 'properties',
    },
    {
      label: 'TaxLots',
      route: 'taxlots',
    },
  ]
  pageTitle: string
  columnsNavigationMenu: NavigationItem[] = [
    {
      id: 'organizations/columns/list',
      title: 'Column List',
      link: '/organizations/columns/list/properties',
      type: 'basic',
      fn: (n: NavigationItem) => { this.setNavTitle(n) },
    },
    {
      id: 'organizations/columns/geocoding',
      link: '/organizations/columns/geocoding/properties',
      title: 'Geocoding',
      type: 'basic',
      fn: (n: NavigationItem) => { this.setNavTitle(n) },
    },
    {
      id: 'organization/columns/data_type',
      link: '/organizations/columns/data_types/properties',
      title: 'Data Types',
      type: 'basic',
      fn: (n: NavigationItem) => { this.setNavTitle(n) },
    },
    {
      id: 'organizations/columns/matching_criteria',
      link: '/organizations/columns/matching_criteria/properties',
      title: 'Matching Criteria',
      type: 'basic',
      fn: (n: NavigationItem) => { this.setNavTitle(n) },
    },
  ]

  ngOnInit(): void {
    this.setTitle()
  }

  currentType(): string {
    return this._location.path().split('/').pop()
  }

  async navigateTo(type: string) {
    const loc = this._location.path()
    if (loc.includes(type)) {
      return
    }
    const newPath = loc.replace(this.inverseType(type), type)
    await this._router.navigateByUrl(newPath).then(() => {
      this.setTitle()
    })
  }

  inverseType(type: string): string {
    return type === 'properties' ? 'taxlots' : 'properties'
  }

  setNavTitle(n: NavigationItem) {
    this.pageTitle = n.title
  }

  setTitle() {
    const basePath = `${this._location.path().split('/').slice(0, -1).join('/')}/properties`
    this.pageTitle = this.columnsNavigationMenu.find((n) => n.link === basePath).title
  }
}
