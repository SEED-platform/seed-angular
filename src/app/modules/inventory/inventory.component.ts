import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatSelectModule } from '@angular/material/select'
import { MatTabsModule } from '@angular/material/tabs'
import { ActivatedRoute, Router } from '@angular/router'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { CellContextMenuEvent, ColDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community'
import { AllCommunityModule, colorSchemeDarkBlue, colorSchemeLight, ModuleRegistry, themeAlpine } from 'ag-grid-community'
import { forkJoin, of, Subject, switchMap, take, takeUntil, tap } from 'rxjs'
import type { Column } from '@seed/api/column'
import { ColumnService } from '@seed/api/column'
import type { Cycle } from '@seed/api/cycle'
import { CycleService } from '@seed/api/cycle/cycle.service'
import { InventoryService } from '@seed/api/inventory'
import { OrganizationService } from '@seed/api/organization'
import { InventoryTabComponent, PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { ConfigService } from '@seed/services'
import type { InventoryPagination, InventoryType, Profile } from './inventory.types'
import * as GridConfig from './inventory-grid.config'

ModuleRegistry.registerModules([AllCommunityModule])
// ModuleRegistry.registerModules([ClientSideRowModelModule])

@Component({
  selector: 'seed-inventory',
  templateUrl: './inventory.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [
    AgGridAngular,
    AgGridModule,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
    PageComponent,
    SharedImports,
    InventoryTabComponent,
  ],
})
export class InventoryComponent implements OnDestroy, OnInit {
  private _activatedRoute = inject(ActivatedRoute)
  private _router = inject(Router)
  private _cycleService = inject(CycleService)
  private _inventoryService = inject(InventoryService)
  private _organizationService = inject(OrganizationService)
  private _columnService = inject(ColumnService)
  private _configService = inject(ConfigService)
  private _orgId: number = null
  private _cycle: Cycle
  private readonly _unsubscribeAll$ = new Subject<void>()
  readonly tabs: InventoryType[] = ['properties', 'taxlots']
  readonly type = this._activatedRoute.snapshot.paramMap.get('type') as InventoryType
  gridApi!: GridApi
  pagination: InventoryPagination
  properties: Record<string, unknown>[]
  profiles: Profile[]
  propertyProfiles: Profile[]
  currentProfileId: number | null = null
  propertyColumns: Column[]
  taxlotColumns: Column[]
  cycles: Cycle[]
  cycleId: number
  chunk = 100
  agPageSize = 100

  gridTheme = themeAlpine.withPart(colorSchemeLight)
  columnDefs: ColDef[]
  rowData: Record<string, unknown>[]
  defaultColDef = GridConfig.defaultColDef
  gridOptions: GridOptions = GridConfig.gridOptions
  firstColumns = GridConfig.firstColumns

  ngOnInit(): void {
    this.setTheme()
    this._organizationService.currentOrganization$.pipe(
      takeUntil(this._unsubscribeAll$),
      switchMap(({ org_id }) => {
        return this.getDependencies(org_id)
      }),
    ).subscribe()
  }

  setTheme() {
    this._configService.config$.subscribe(({ scheme }) => {
      // if auto, check browser preference, otherwise use scheme
      const darkMode = scheme === 'auto'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : scheme === 'dark'

      this.gridTheme = themeAlpine.withPart(darkMode ? colorSchemeDarkBlue : colorSchemeLight)
    })
  }

  /*
  * get cycles, profiles, columns, inventory
  */
  getDependencies(org_id: number) {
    this._orgId = org_id

    return forkJoin({
      cycles: this._cycleService.get(this._orgId),
      profiles: this._inventoryService.getColumnListProfiles('List View Profile', 'properties', true),
      propertyColumns: this._columnService.propertyColumns$.pipe(take(1)),
    }).pipe(
      tap((results) => { this.setDependencies(results) }),
    )
  }

  /*
  * set class variables: cycles, profiles, columns, inventory
  */
  setDependencies({ cycles, profiles, propertyColumns }: { cycles: Cycle[]; profiles: Profile[]; propertyColumns: Column[] }) {
    this.cycles = cycles
    this._cycle = cycles.at(0) ?? null
    this.cycleId = this._cycle?.id
    this.profiles = profiles
    this.propertyProfiles = this.profiles.filter((p) => p.inventory_type === 0)
    this.propertyColumns = propertyColumns

    const id = this.profiles.length ? this.profiles[0].id : null
    this.getProfile(id)
  }

  /*
  * get profile and reload inventory
  */
  getProfile(id: number) {
    const profileRequest = id ? this._inventoryService.getColumnListProfile(id) : of(null)
    profileRequest.subscribe((profile) => {
      this.currentProfileId = profile?.id
      this.loadInventory(1)
    })
  }

  loadInventory(page: number) {
    console.log('load inventory')

    const params = {
      cycle: this._cycle.id,
      ids_only: false,
      include_related: true,
      organization_id: this._orgId,
      page,
      per_page: this.chunk,
    }
    const data = {
      include_property_ids: null,
      profile_id: this.currentProfileId,
    }
    this._inventoryService.getAgProperties(params, data).subscribe(({ pagination, results, column_defs }) => {
      this.pagination = pagination
      this.properties = results
      this.rowData = results
      this.columnDefs = [...this.firstColumns, ...column_defs]

      // this.columnDefs.unshift(this.actionButton)
      // this.columnDefs.unshift(this.checkBoxConfig)
      // need a spinner or loading bar
    })
  }

  onCycleChange(id: number) {
    console.log('cycle change', id)
    this.cycleId = id
    this._cycle = this.cycles.find((cycle) => cycle.id === id)
    this.loadInventory(1)
  }

  onProfileChange(id: number) {
    console.log('profile change', id)
    this.getProfile(id)
  }

  onGridReady(params: GridReadyEvent) {
    console.log('grid ready')
    this.gridApi = params.api

    // this.gridApi.addEventListener('cellContextMenu', this.onRightClick.bind(this))
  }

  // onRightClick(event: CellContextMenuEvent<unknown>) {
  //   event.event.preventDefault() // Prevent browser default menu

  //   // Get row data
  //   const rowData = event.node?.data as { id: number }

  //   // Remove any existing menu
  //   document.querySelector('.custom-context-menu')?.remove();

  //   // Create custom menu
  //   const menu = document.createElement('div')
  //   menu.classList.add('custom-context-menu')
  //   menu.style.top = `${(event.event as MouseEvent).clientY}px`
  //   menu.style.left = `${(event.event as MouseEvent).clientX}px`

  //   menu.innerHTML = `
  //   <div class="menu-item" onclick="handleMenuAction('view', ${rowData.id})">🔍 View Details</div>
  //   <div class="menu-item" onclick="handleMenuAction('edit', ${rowData.id})">✏️ Edit</div>
  //   <div class="menu-item delete" onclick="handleMenuAction('delete', ${rowData.id})">❌ Delete</div>
  // `

  //   document.body.appendChild(menu)

  //   // Remove menu when clicking elsewhere
  //   document.addEventListener('click', () => {
  //     menu.remove()
  //   }, { once: true })
  // }

  // // Global function to handle menu actions
  // handleMenuAction(action, rowId) {
  //   console.log(`Action: ${action}, Row ID: ${rowId}`);
  // }

  onSortChange() {
    const sorts = this.gridApi.getColumnState()
      .filter((col) => col.sort)
      .map((col) => ({ colId: col.colId, sort: col.sort }))
    console.log('sort change', sorts)
  }

  onFilterChange() {
    const filters = this.gridApi.getFilterModel()
    console.log('filter change', filters)
  }

  onPageChange(direction: 'first' | 'previous' | 'next' | 'last') {
    const { page, num_pages } = this.pagination
    const pageLookup = { first: 1, previous: page - 1, next: page + 1, last: num_pages }

    const newPage = pageLookup[direction]
    if (newPage < 1 || newPage > num_pages) return

    this.loadInventory(pageLookup[direction])
  }

  async toggleInventoryType(type: InventoryType) {
    if (type !== this.type) {
      // Hack to route to reload the current component
      await this._router.navigateByUrl('/', { skipLocationChange: true })
      await this._router.navigate([this.type === 'properties' ? 'taxlots' : 'properties'])
    }
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
