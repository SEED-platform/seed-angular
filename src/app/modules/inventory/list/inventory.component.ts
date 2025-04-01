import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule } from '@angular/material/dialog'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatSelectModule } from '@angular/material/select'
import { MatTabsModule } from '@angular/material/tabs'
import { MatTooltipModule } from '@angular/material/tooltip'
import { ActivatedRoute, Router } from '@angular/router'
import type { ColDef, GridApi } from 'ag-grid-community'
import type { Observable } from 'rxjs'
import { forkJoin, map, of, Subject, switchMap, take, takeUntil, tap } from 'rxjs'
import type { Column } from '@seed/api/column'
import type { Cycle } from '@seed/api/cycle'
import { CycleService } from '@seed/api/cycle/cycle.service'
import { InventoryService } from '@seed/api/inventory'
import type { Label } from '@seed/api/label'
import { LabelService } from '@seed/api/label'
import type { OrganizationUser, OrganizationUserSettings } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import type { CurrentUser } from '@seed/api/user'
import { UserService } from '@seed/api/user'
import { InventoryTabComponent, PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { ActionsComponent, ConfigSelectorComponent, FilterSortChipsComponent, InventoryGridComponent } from '../grid'
// import { CellHeaderMenuComponent } from './grid/cell-header-menu.component'
import type { AgFilterResponse, FiltersSorts, InventoryDependencies, InventoryPagination, InventoryType, Profile } from '../inventory.types'

@Component({
  selector: 'seed-inventory',
  templateUrl: './inventory.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [
    ActionsComponent,
    CommonModule,
    ConfigSelectorComponent,
    FilterSortChipsComponent,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
    MatTooltipModule,
    PageComponent,
    SharedImports,
    InventoryTabComponent,
    InventoryGridComponent,
  ],
})
export class InventoryComponent implements OnDestroy, OnInit {
  private _activatedRoute = inject(ActivatedRoute)
  private _router = inject(Router)
  private _cycleService = inject(CycleService)
  private _inventoryService = inject(InventoryService)
  private _organizationService = inject(OrganizationService)
  private _labelService = inject(LabelService)
  private _userService = inject(UserService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  readonly tabs: InventoryType[] = ['properties', 'taxlots']
  readonly type = this._activatedRoute.snapshot.paramMap.get('type') as InventoryType
  chunk = 100
  columnDefs: ColDef[]
  currentUser: CurrentUser
  orgUserId: number
  cycle: Cycle
  cycleId: number
  cycles: Cycle[]
  firstLoad = true
  gridApi: GridApi
  labelLookup: Record<number, Label> = {}
  inventory: Record<string, unknown>[]
  orgId: number = null
  page = 1
  pageTitle = this.type === 'taxlots' ? 'Tax Lots' : 'Properties'
  pagination: InventoryPagination
  profile: Profile
  profileId: number
  allProfiles: Profile[]
  propertyColumns: Column[]
  propertyProfiles: Profile[]
  taxlotProfiles: Profile[]
  rowData: Record<string, unknown>[]
  selectedViewIds: number[] = []
  taxLotColumns: Column[]
  userSettings: OrganizationUserSettings = {}

  /*
  * 1. get org
  * 2. get dependencies: cycles, profiles, columns, labels, current user
  * 3. set dependencies & get profile
  * 4. load inventory
  * 5. set filters and sorts from user settings
  */
  ngOnInit(): void {
    this._organizationService.currentOrganization$.pipe(
      takeUntil(this._unsubscribeAll$),
      switchMap(({ org_id }) => this.getDependencies(org_id)),
      map((results) => this.setDependencies(results)),
      switchMap((profile_id) => this.getProfile(profile_id)),
      switchMap(() => this.loadInventory()),
      tap(() => { this.setFilterSorts() }),
    ).subscribe()
  }

  /*
  * get cycles, profiles, columns, inventory, current user
  */
  getDependencies(org_id: number) {
    this.orgId = org_id

    return forkJoin({
      cycles: this._cycleService.get(this.orgId),
      profiles: this._inventoryService.getColumnListProfiles('List View Profile', 'properties', true),
      // propertyColumns: this._columnService.propertyColumns$.pipe(take(1)),
      // taxLotColumns: this._columnService.taxLotColumns$.pipe(take(1)),
      labels: this._labelService.labels$.pipe(take(1)),
      currentUser: this._userService.currentUser$.pipe(take(1)),
    })
  }

  /*
  * set class variables: cycles, profiles, columns, inventory. returns profile id
  */
  // setDependencies({ cycles, profiles, propertyColumns, taxLotColumns, labels, currentUser }: InventoryDependencies) {
  setDependencies({ cycles, profiles, labels, currentUser }: InventoryDependencies) {
    if (!cycles) {
      return null
    }

    const { org_user_id, settings } = currentUser
    this.currentUser = currentUser
    this.orgUserId = org_user_id
    this.userSettings = settings

    this.cycles = cycles
    this.cycle = this.cycles.find((c) => c.id === this.userSettings?.cycle_id) ?? this.cycles[0]
    this.cycleId = this.cycle.id

    this.propertyProfiles = profiles.filter((p) => p.inventory_type === 0)
    this.taxlotProfiles = profiles.filter((p) => p.inventory_type === 1)
    // this.propertyColumns = propertyColumns
    // this.taxLotColumns = taxLotColumns

    for (const label of labels) {
      this.labelLookup[label.id] = label
    }

    const profile_id = this.profiles.find((p) => p.id === this.userSettings.profile_id)?.id ?? this.profiles[0]?.id
    return profile_id
  }

  get profiles() {
    return this.type === 'properties' ? this.propertyProfiles : this.taxlotProfiles
  }

  /*
  * get profile and reload inventory
  * retrieve profile returns a more detailed Profile object than list profiles
  */
  getProfile(id: number): Observable<Profile | null> {
    if (!id) {
      return of(null)
    }

    return this._inventoryService.getColumnListProfile(id)
      .pipe(
        tap((profile) => {
          this.profile = profile
          this.profileId = profile.id
          this.userSettings.profile_id = profile.id
        }),
      )
  }

  /*
  * Loads inventory for the grid.
  * returns a null observable to track completion
  */
  loadInventory(): Observable<null> {
    if (!this.cycleId) return of(null)
    const inventory_type = this.type === 'properties' ? 'property' : 'taxlot'
    const params = new URLSearchParams({
      cycle: this.cycleId.toString(),
      ids_only: 'false',
      include_related: 'true',
      organization_id: this.orgId.toString(),
      page: this.page.toString(),
      per_page: this.chunk.toString(),
      inventory_type,
    })

    const data = {
      include_property_ids: null,
      profile_id: this.profileId,
      filters: this.filters,
      sorts: this.sorts,
    }

    return this._inventoryService.getAgInventory(params.toString(), data).pipe(
      tap(({ pagination, results, column_defs }: AgFilterResponse) => {
        console.log('load inventory')
        this.pagination = pagination
        this.inventory = results

        this.columnDefs = column_defs
        this.rowData = results
      }),
      map(() => null),
    ) as Observable<null>
  }

  /*
  * on initial page load, set any filters and sorts from the user settings
  */
  setFilterSorts() {
    this.setFilters()
    this.setSorts()
  }

  onGridReady(gridApi: GridApi) {
    this.gridApi = gridApi
  }

  onSelectionChanged() {
    this.selectedViewIds = this.gridApi.getSelectedRows().map(({ property_view_id }: { property_view_id: number }) => property_view_id)
  }

  onProfileChange(id: number) {
    this.getProfile(id).pipe(
      switchMap(() => this.loadInventory()),
      switchMap(() => this.updateOrgUserSettings()),
    ).subscribe()
  }

  onCycleChange(id: number) {
    this.cycleId = id
    this.cycle = this.cycles.find((cycle) => cycle.id === id)
    this.page = 1
    this.userSettings.cycle_id = id
    this.updateOrgUserSettings().pipe(switchMap(() => this.loadInventory())).subscribe()
  }

  updateOrgUserSettings(): Observable<OrganizationUser> {
    return this._organizationService.updateOrganizationUser(this.orgUserId, this.orgId, this.userSettings).pipe(
      map((response) => response.data),
      tap(({ settings }) => {
        this.userSettings = settings
      }),
    )
  }

  onPageChange(page: number) {
    this.page = page
    this.loadInventory()
  }

  setFilters() {
    if (Object.keys(this.filters).length === 0) return

    const validColIds = new Set(this.gridApi.getColumns().map((c) => c.getColId()))
    const validFilters = {}
    // filter out any filters that are not in the current column definitions.
    for (const colId in this.filters) {
      if (validColIds.has(colId)) {
        validFilters[colId] = this.filters[colId]
      }
    }

    this.gridApi.setFilterModel(validFilters)
  }

  setSorts() {
    if (!this.sorts.length) return

    for (const sort of this.sorts) {
      const colId = sort.replace(/^-/, '')
      const direction = sort.startsWith('-') ? 'desc' : 'asc'
      const colDef = this.columnDefs.find((col) => col.field === colId)
      if (colDef) colDef.sort = direction
    }
    this.gridApi.onSortChanged()
  }

  get sorts() {
    return this.userSettings.sorts?.[this.type] ?? []
  }

  get filters() {
    return this.userSettings.filters?.[this.type] ?? {}
  }

  onFilterSortChange({ sorts, filters }: FiltersSorts) {
    this.page = 1
    this.userSettings.filters[this.type] = filters
    this.userSettings.sorts[this.type] = sorts

    if (this.firstLoad) {
      this.firstLoad = false
      return
    }

    this.updateOrgUserSettings().pipe(switchMap(() => this.loadInventory())).subscribe()
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
