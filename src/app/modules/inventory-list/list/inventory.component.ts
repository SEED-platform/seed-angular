import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import type { ColDef, GridApi } from 'ag-grid-community'
import type { Observable } from 'rxjs'
import { BehaviorSubject, catchError, combineLatest, filter, map, of, Subject, switchMap, takeUntil, tap } from 'rxjs'
import type { CurrentUser, Cycle, Label, OrganizationUserResponse, OrganizationUserSettings } from '@seed/api'
import { CycleService, InventoryService, LabelService, OrganizationService, UserService } from '@seed/api'
import { InventoryTabComponent, PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { MaterialImports } from '@seed/materials'
import { naturalSort } from '@seed/utils'
import type {
  AgFilterResponse,
  FiltersSorts,
  InventoryDependencies,
  InventoryType,
  Pagination,
  Profile,
} from 'app/modules/inventory'
import { ActionsComponent, ConfigSelectorComponent, FilterSortChipsComponent, InventoryGridComponent } from './grid'
// import { CellHeaderMenuComponent } from './grid/cell-header-menu.component'

@Component({
  selector: 'seed-inventory',
  templateUrl: './inventory.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [
    ActionsComponent,
    CommonModule,
    ConfigSelectorComponent,
    FilterSortChipsComponent,
    MaterialImports,
    PageComponent,
    SharedImports,
    InventoryTabComponent,
    InventoryGridComponent,
  ],
})
export class InventoryComponent implements OnDestroy, OnInit {
  private _activatedRoute = inject(ActivatedRoute)
  private _cycleService = inject(CycleService)
  private _inventoryService = inject(InventoryService)
  private _organizationService = inject(OrganizationService)
  private _labelService = inject(LabelService)
  private _userService = inject(UserService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  readonly tabs: InventoryType[] = ['properties', 'taxlots']
  readonly type = this._activatedRoute.snapshot.paramMap.get('type') as InventoryType
  chunk = 100
  columnDefs: ColDef[] = []
  currentUser: CurrentUser
  cycle: Cycle
  cycleId: number
  cycleId$ = new BehaviorSubject<number>(null)
  cycles: Cycle[]
  gridApi: GridApi
  labelMap: Record<number, Label> = {}
  inventory: Record<string, unknown>[]
  orgId: number = null
  orgUserId: number
  page = 1
  pageTitle = this.type === 'taxlots' ? 'Tax Lots' : 'Properties'
  pagination: Pagination
  profile: Profile
  profileId: number
  profileId$ = new BehaviorSubject<number>(null)
  propertyProfiles: Profile[]
  refreshInventory$ = new Subject<void>()
  rowData: Record<string, unknown>[]
  selectedViewIds: number[] = []
  taxlotProfiles: Profile[]
  userSettings: OrganizationUserSettings = {}

  /*
   * 1. get org
   * 2. get dependencies: cycles, profiles, labels, current user
   * 3. set dependencies & get profile
   * 4. load inventory
   * 5. set filters and sorts from user settings
   */
  ngOnInit(): void {
    this.initPage()
  }

  initPage() {
    this._userService.currentOrganizationId$
      .pipe(
        switchMap((orgId) => this.getDependencies(orgId)),
        map((results) => this.setDependencies(results)),
        switchMap((profile_id) => this.getProfile(profile_id)),
        switchMap(() => this.loadInventory()),
        tap(() => {
          this.setFilterSorts()
          this.initStreams()
        }),
        takeUntil(this._unsubscribeAll$),
        catchError((err) => {
          console.error('Error initializing inventory:', err)
          return of(null)
        }),
      )
      .subscribe()
  }

  initStreams() {
    this.profileId$
      .pipe(
        filter(Boolean),
        takeUntil(this._unsubscribeAll$),
        switchMap((id) => this.getProfile(id)),
        switchMap(() => this.refreshInventory()),
      )
      .subscribe()

    this.cycleId$
      .pipe(
        filter(Boolean),
        takeUntil(this._unsubscribeAll$),
        switchMap(() => this.refreshInventory()),
      )
      .subscribe()

    this.refreshInventory$.pipe(switchMap(() => this.refreshInventory())).subscribe()
  }

  refreshInventory() {
    return this.updateOrgUserSettings().pipe(switchMap(() => this.loadInventory()))
  }

  /*
   * get cycles, profiles, columns, inventory, current user
   */
  getDependencies(org_id: number) {
    this.orgId = org_id
    this._cycleService.getCycles(this.orgId)

    return combineLatest([
      this._userService.currentUser$,
      this._cycleService.cycles$,
      this._labelService.labels$,
      this._inventoryService.getColumnListProfiles('List View Profile', 'properties', true),
    ])
  }

  /*
   * set class variables: cycles, profiles, inventory. returns profile id
   */
  setDependencies([currentUser, cycles, labels, profiles]: InventoryDependencies) {
    if (!cycles) {
      return null
    }

    const { org_user_id, settings } = currentUser
    this.currentUser = currentUser
    this.orgUserId = org_user_id
    this.userSettings = settings

    this.cycles = cycles
    this.cycle = this.cycles.find((c) => c.id === this.userSettings?.cycleId) ?? this.cycles[0]
    this.cycleId = this.cycle?.id

    this.propertyProfiles = profiles.filter((p) => p.inventory_type === 0)
    this.taxlotProfiles = profiles.filter((p) => p.inventory_type === 1)

    for (const label of labels) {
      this.labelMap[label.id] = label
    }

    const profileId = this.profiles.find((p) => p.id === this.userSettings.profile.list[this.type])?.id ?? this.profiles[0]?.id
    return profileId
  }

  get profiles() {
    const profiles = this.type === 'properties' ? this.propertyProfiles : this.taxlotProfiles
    if (!profiles) return
    return profiles.sort((a, b) => naturalSort(a.name, b.name))
  }

  /*
   * get profile and reload inventory
   * retrieve profile returns a more detailed Profile object than list profiles
   */
  getProfile(id: number): Observable<Profile | null> {
    if (!id) {
      this.profile = null
      this.profileId = null
      return of(null)
    }

    return this._inventoryService.getColumnListProfile(id).pipe(
      tap((profile) => {
        this.profile = profile
        this.profileId = profile.id
        this.userSettings.profile.list[this.type] = profile.id
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
    this.selectedViewIds = this.type === 'taxlots'
      ? this.gridApi.getSelectedRows().map(({ taxlot_view_id }: { taxlot_view_id: number }) => taxlot_view_id)
      : this.gridApi.getSelectedRows().map(({ property_view_id }: { property_view_id: number }) => property_view_id)
  }

  onSelectAll(selectedViewIds: number[]) {
    this.selectedViewIds = selectedViewIds
  }

  onProfileChange(id: number) {
    this.profileId$.next(id)
  }

  onCycleChange(id: number) {
    this.cycleId = id
    this.cycle = this.cycles.find((cycle) => cycle.id === id)
    this.page = 1
    this.userSettings.cycleId = id
    this.cycleId$.next(id)
  }

  updateOrgUserSettings(): Observable<OrganizationUserResponse> {
    return this._organizationService.updateOrganizationUser(this.orgUserId, this.orgId, this.userSettings)
  }

  onGridReset() {
    this.userSettings.filters = {}
    this.userSettings.sorts = {}
    this.refreshInventory$.next()
  }

  onPageChange(page: number) {
    this.page = page
    this.refreshInventory$.next()
  }

  setFilters() {
    if (Object.keys(this.filters).length === 0) return

    const validFilters = {}
    const colIds = new Set(this.columnDefs.map((c) => c.field))
    // filter out any filters that are not in the current column definitions.
    for (const colId in this.filters) {
      if (colIds.has(colId)) validFilters[colId] = this.filters[colId]
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
    this.refreshInventory$.next()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
