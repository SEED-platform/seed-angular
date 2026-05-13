import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import type { ColDef, GridApi } from 'ag-grid-community'
import type { Observable } from 'rxjs'
import { BehaviorSubject, catchError, combineLatest, filter, map, of, Subject, switchMap, take, takeUntil, tap } from 'rxjs'
import type { Column, CurrentUser, Cycle, Label, OrganizationUserResponse, OrganizationUserSettings } from '@seed/api'
import { ColumnService, CycleService, InventoryService, LabelService, OrganizationService, UserService } from '@seed/api'
import { PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { naturalSort } from '@seed/utils'
import type {
  AgFilterResponse,
  FiltersSorts,
  InventoryDependencies,
  InventoryType,
  Pagination,
  Profile,
  State,
} from 'app/modules/inventory'
import { ActionsComponent, ConfigSelectorComponent, FilterGroupSelectorComponent, FilterSortChipsComponent, InventoryGridComponent } from './grid'
import type { LabelSelections } from './grid/filter-group/filter-group-selector.component'

@Component({
  selector: 'seed-inventory',
  templateUrl: './inventory.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [ActionsComponent, ConfigSelectorComponent, FilterGroupSelectorComponent, FilterSortChipsComponent, InventoryGridComponent, PageComponent, SharedImports],
})
export class InventoryComponent implements OnDestroy, OnInit {
  private _activatedRoute = inject(ActivatedRoute)
  private _columnService = inject(ColumnService)
  private _cycleService = inject(CycleService)
  private _inventoryService = inject(InventoryService)
  private _organizationService = inject(OrganizationService)
  private _labelService = inject(LabelService)
  private _userService = inject(UserService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  readonly tabs: InventoryType[] = ['properties', 'taxlots']
  readonly type = this._activatedRoute.snapshot.paramMap.get('type') as InventoryType
  chunk = 100
  columns: Column[] = []
  columnDefs: ColDef[] = []
  currentUser: CurrentUser
  cycle: Cycle
  cycleId: number
  cycleId$ = new BehaviorSubject<number>(null)
  cycles: Cycle[]
  gridApi: GridApi
  labelMap: Record<number, Label> = {}
  labels: Label[] = []
  appliedLabels: Label[] = []
  labelSelections: LabelSelections = { andLabels: [], orLabels: [], excludeLabels: [] }
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
  selectedStateIds: number[] = []
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
        tap(() => { this._fetchAppliedLabels() }),
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

    this._organizationService.orgUserSettings$.pipe(tap((settings) => (this.userSettings = settings))).subscribe()

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
    const columns$ = this.type === 'taxlots' ? this._columnService.taxLotColumns$ : this._columnService.propertyColumns$

    return combineLatest([
      columns$,
      this._userService.currentUser$,
      this._cycleService.cycles$,
      this._labelService.labels$,
      this._inventoryService.getColumnListProfiles('List View Profile', 'properties', true),
    ])
  }

  /*
   * set class variables: cycles, profiles, inventory. returns profile id
   */
  setDependencies([columns, currentUser, cycles, labels, profiles]: InventoryDependencies) {
    if (!cycles) {
      return null
    }
    this.columns = columns

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
    this.labels = labels

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
    this.validateCycleId()
    // org change can lead to a mismatch
    if (!this.cycleId || this.orgId !== this.cycle.organization) {
      return of(null)
    }

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

    const { includeViewIds, excludeViewIds } = this._computeLabelViewIds()
    const data: Record<string, unknown> = {
      include_property_ids: null,
      profile_id: this.profileId,
      filters: this.filters,
      sorts: this.sorts,
    }
    if (includeViewIds) {
      data.include_view_ids = includeViewIds
    }
    if (excludeViewIds) {
      data.exclude_view_ids = excludeViewIds
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

  validateCycleId() {
    if (!this.cycleId) this.cycleId = null
    const settingsCycleId = this.userSettings?.cycleId
    if (!settingsCycleId) return
    if (settingsCycleId !== this.cycleId) this.cycleId = settingsCycleId
  }

  /*
   * on initial page load, set any filters and sorts from the user settings
   */
  setFilterSorts() {
    this.setFilters()
    this.setSorts()
    this.setPins()
  }

  onGridReady(gridApi: GridApi) {
    this.gridApi = gridApi
  }

  onSelectionChanged() {
    // this.selectedViewIds = this.type === 'taxlots'
    //   ? this.gridApi.getSelectedRows().map(({ taxlot_view_id }: { taxlot_view_id: number }) => taxlot_view_id)
    //   : this.gridApi.getSelectedRows().map(({ property_view_id }: { property_view_id: number }) => property_view_id)

    const selectedRows = this.gridApi.getSelectedRows() as State[]
    if (this.type === 'taxlots') {
      this.selectedViewIds = selectedRows.map((state) => state.taxlot_view_id)
      this.selectedStateIds = selectedRows.map((state) => state.taxlot_state_id)
    } else {
      this.selectedViewIds = selectedRows.map((state) => state.property_view_id)
      this.selectedStateIds = selectedRows.map((state) => state.property_state_id)
    }
  }

  onSelectAll(selectedViewIds: number[]) {
    this.selectedViewIds = selectedViewIds
    this.selectedStateIds
      = this.type === 'taxlots'
        ? this.gridApi.getSelectedRows().map((state: State) => state.taxlot_state_id)
        : this.gridApi.getSelectedRows().map((state: State) => state.property_state_id)
  }

  onProfileChange(id: number) {
    this.profileId$.next(id)
  }

  onCycleChange(id: number) {
    this.cycleId = id
    this.cycle = this.cycles.find((cycle) => cycle.id === id)
    this.page = 1
    this.userSettings.cycleId = id
    this._fetchAppliedLabels()
    this.cycleId$.next(id)
  }

  updateOrgUserSettings(): Observable<OrganizationUserResponse> {
    return this._organizationService.updateOrganizationUser(this.orgUserId, this.orgId, this.userSettings)
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

  setPins() {
    if (!this.userSettings.pins) return

    const { left, right } = this.userSettings.pins[this.type] || {}

    for (const col of left) {
      const colDef = this.columnDefs.find((c) => c.field === col)
      if (colDef) {
        colDef.pinned = 'left'
      }
    }

    for (const col of right) {
      const colDef = this.columnDefs.find((c) => c.field === col)
      if (colDef) {
        colDef.pinned = 'right'
      }
    }
  }

  get sorts() {
    return this.userSettings.sorts?.[this.type] ?? []
  }

  get filters() {
    return this.userSettings.filters?.[this.type] ?? {}
  }

  get filterGroupInventoryType() {
    return this.type === 'taxlots' ? 'Tax Lot' as const : 'Property' as const
  }

  onFilterGroupApplied(fg: { query_dict?: Record<string, unknown> } | null): void {
    // Sync filter group's query_dict into userSettings so loadInventory uses consistent filters
    if (fg?.query_dict) {
      this.userSettings = { ...this.userSettings, filters: { ...this.userSettings.filters, [this.type]: fg.query_dict as Record<string, Record<string, unknown>> } }
    } else {
      // When deselecting a filter group, preserve whatever filters the grid currently has
      const currentGridFilters = this.gridApi?.getFilterModel() ?? {}
      this.userSettings = { ...this.userSettings, filters: { ...this.userSettings.filters, [this.type]: currentGridFilters as Record<string, Record<string, unknown>> } }
    }
    this.page = 1
    // Don't call loadInventory here — labelSelectionsChanged always fires right after
    // and will trigger the reload with the correct label state
  }

  onLabelSelectionsChanged(selections: LabelSelections): void {
    this.labelSelections = selections
    this.page = 1
    // Create new userSettings reference to trigger OnChanges in FilterSortChipsComponent
    this.userSettings = { ...this.userSettings }
    this.loadInventory().pipe(take(1)).subscribe()
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

  // Compute include/exclude view IDs from label selections and is_applied data
  private _computeLabelViewIds(): { includeViewIds: number[] | null; excludeViewIds: number[] | null } {
    const { andLabels, orLabels, excludeLabels } = this.labelSelections
    let includeViewIds: number[] | null = null
    let excludeViewIds: number[] | null = null

    // AND labels: intersection of all is_applied arrays
    if (andLabels.length > 0) {
      const sets = andLabels
        .map((id) => this.appliedLabels.find((l) => l.id === id))
        .filter((l): l is Label => !!l && !!l.is_applied)
        .map((l) => new Set(l.is_applied))

      if (sets.length > 0) {
        const intersection = [...sets[0]].filter((id) => sets.every((s) => s.has(id)))
        includeViewIds = intersection.length > 0 ? intersection : [0]
      } else {
        includeViewIds = [0]
      }
    }

    // OR labels: union of all is_applied arrays
    if (orLabels.length > 0) {
      const union = new Set<number>()
      for (const id of orLabels) {
        const label = this.appliedLabels.find((l) => l.id === id)
        if (label?.is_applied) {
          for (const viewId of label.is_applied) {
            union.add(viewId)
          }
        }
      }

      if (includeViewIds !== null) {
        // If AND labels already produced the no-match sentinel, preserve it.
        if (includeViewIds.length === 1 && includeViewIds[0] === 0) {
          includeViewIds = [0]
        } else {
          // Intersect with AND results
          const orSet = union
          const combined = includeViewIds.filter((id) => orSet.has(id))
          includeViewIds = combined.length > 0 ? combined : [0]
        }
      } else {
        includeViewIds = union.size > 0 ? [...union] : [0]
      }
    }

    // Exclude labels: union of all is_applied arrays
    if (excludeLabels.length > 0) {
      const excludeSet = new Set<number>()
      for (const id of excludeLabels) {
        const label = this.appliedLabels.find((l) => l.id === id)
        if (label?.is_applied) {
          for (const viewId of label.is_applied) {
            excludeSet.add(viewId)
          }
        }
      }
      excludeViewIds = [...excludeSet]
    }

    return { includeViewIds, excludeViewIds }
  }

  private _fetchAppliedLabels(): void {
    if (!this.orgId || !this.cycleId) return
    this._labelService
      .getInventoryLabels(this.orgId, [], this.cycleId, this.type)
      .pipe(
        take(1),
        tap((labels) => {
          this.appliedLabels = labels
        }),
      )
      .subscribe()
  }
}
