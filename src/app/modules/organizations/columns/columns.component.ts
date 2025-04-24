import { CommonModule, Location } from '@angular/common'
import { AfterViewInit, Component, inject, ViewChild, type OnInit, type Type } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav'
import { MatTabsModule } from '@angular/material/tabs'
import { Title } from '@angular/platform-browser'
import { Router, RouterOutlet } from '@angular/router'
import { DrawerService, type NavigationItem, VerticalNavigationComponent } from '@seed/components'
import { PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { ColumnDataTypesHelpComponent } from './data-types/help.component'
import { ColumnGeocodingHelpComponent } from './geocoding/help.component'
import { ColumnImportSettingsHelpComponent } from './import-settings/help.component'
import { ColumnListHelpComponent } from './list/help.component'
import { ColumnMappingHelpComponent } from './mappings/help.component'

type ColumnNavigationItem = NavigationItem & { useTabs: boolean; helpComponent: Type<Component> | null }
@Component({
  selector: 'seed-organizations-columns',
  templateUrl: './columns.component.html',
  imports: [
    CommonModule,
    SharedImports,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatTabsModule,
    PageComponent,
    VerticalNavigationComponent,
    RouterOutlet,
  ],
})
export class ColumnsComponent implements AfterViewInit, OnInit {
  @ViewChild('drawer') drawer!: MatDrawer
  private _drawerService = inject(DrawerService)
  private _title = inject(Title)
  private _router = inject(Router)
  private _location = inject(Location)
  drawerOpened = true
  helpOpened = false
  helpComponent: Type<Component> | null
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
  useTabs = false
  columnsNavigationMenu: ColumnNavigationItem[] = [
    {
      id: 'organizations/columns/list',
      exactMatch: false,
      title: 'Column List',
      link: '/organizations/columns/list',
      type: 'basic',
      useTabs: true,
      fn: (n: ColumnNavigationItem) => { this.setPageInfo(n) },
      helpComponent: ColumnListHelpComponent,
    },
    {
      id: 'organizations/columns/geocoding',
      link: '/organizations/columns/geocoding',
      title: 'Geocoding',
      type: 'basic',
      useTabs: true,
      fn: (n: ColumnNavigationItem) => { this.setPageInfo(n) },
      helpComponent: ColumnGeocodingHelpComponent,
    },
    {
      id: 'organization/columns/data-type',
      link: '/organizations/columns/data-types',
      title: 'Data Types',
      type: 'basic',
      useTabs: true,
      fn: (n: ColumnNavigationItem) => { this.setPageInfo(n) },
      helpComponent: ColumnDataTypesHelpComponent,
    },
    {
      id: 'organizations/columns/import-settings',
      link: '/organizations/columns/import-settings',
      title: 'Import Settings',
      type: 'basic',
      useTabs: true,
      fn: (n: ColumnNavigationItem) => { this.setPageInfo(n) },
      helpComponent: ColumnImportSettingsHelpComponent,
    },
    {
      id: 'organizations/columns/mappings',
      link: '/organizations/columns/mappings',
      title: 'Column Mappings',
      type: 'basic',
      useTabs: false,
      fn: (n: ColumnNavigationItem) => { this.setPageInfo(n) },
      helpComponent: ColumnMappingHelpComponent,
    },
  ]

  ngOnInit(): void {
    this.setTitle()
  }

  ngAfterViewInit() {
    this._drawerService.setDrawer(this.drawer)
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

  setPageInfo(n: ColumnNavigationItem) {
    this.pageTitle = n.title
    this.useTabs = n.useTabs
    this.helpComponent = n.helpComponent
  }

  setTitle() {
    let basePath = this._location.path()
    if (basePath.includes('properties')) {
      basePath = `${this._location.path().split('/').slice(0, -1).join('/')}/properties`
    }
    this.setPageInfo(this.columnsNavigationMenu.find((n) => basePath.includes(n.link)))
  }

  toggleDrawer = (): void => {
    this.drawerOpened = !this.drawerOpened
    if (this.drawerOpened) {
      this.helpOpened = false
    }
  }

  toggleHelp = () => {
    this.helpOpened = !this.helpOpened
  }
}
