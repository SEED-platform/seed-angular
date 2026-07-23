import { CommonModule } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { AgGridAngular } from 'ag-grid-angular'
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import type { Observable } from 'rxjs'
import { combineLatest, EMPTY, switchMap, tap } from 'rxjs'
import type { Column, CurrentUser, Organization, OrgCycle } from '@seed/api'
import { ColumnService, InventoryService, OrganizationService, UserService } from '@seed/api'
import { PageComponent } from '@seed/components'
import { MaterialImports } from '@seed/materials'
import { ConfigService } from '@seed/services'
import type { InventoryDisplayType, InventoryType, Profile } from 'app/modules/inventory/inventory.types'

@Component({
  selector: 'seed-inventory-list-cross-cycles',
  templateUrl: './cross-cycles.component.html',
  imports: [AgGridAngular, CommonModule, MaterialImports, PageComponent],
})
export class CrossCyclesComponent implements OnInit {
  private _route = inject(ActivatedRoute)
  private _columnService = inject(ColumnService)
  private _configService = inject(ConfigService)
  private _inventoryService = inject(InventoryService)
  private _organizationService = inject(OrganizationService)
  private _userService = inject(UserService)
  columnDefs: ColDef[] = []
  columns: Column[]
  columnMap: Map<string, string>
  currentUser: CurrentUser
  cycles: OrgCycle[]
  displayType: InventoryDisplayType
  gridTheme$ = this._configService.gridTheme$
  gridApi: GridApi
  matchingColumns: Set<string>
  orgId: number
  org: Organization
  profile: Profile
  profiles: Profile[]
  rowData: Record<string, unknown>[] = []
  selectedCycleIds: number[] = []
  selectedProfileId: number
  type = this._route.snapshot.paramMap.get('type') as InventoryType

  ngOnInit(): void {
    this.displayType = this.type === 'properties' ? 'Property' : 'Tax Lot'
    this.initPage()
    console.error(
      'DEVELOPER NOTE: Row grouping is an enterprise only feature. Cross cycles will need a new approach to show grouped/nested data',
    )
  }

  initPage() {
    this._organizationService.currentOrganization$.pipe(switchMap((org) => this.getDependencies(org))).subscribe()
  }

  getDependencies(org: Organization): Observable<unknown> {
    this.org = org
    this.orgId = org.id
    this.cycles = org.cycles
    if (!this.cycles.length) return EMPTY

    const columns$ = this.type === 'properties' ? this._columnService.propertyColumns$ : this._columnService.taxLotColumns$
    return combineLatest([
      this._userService.currentUser$,
      this._inventoryService.getColumnListProfiles('Detail List Profile', this.type),
      this._organizationService.getMatchingCriteriaColumns(this.orgId, this.type),
      columns$,
    ]).pipe(
      tap(([currentUser, profiles, matchingColumns, columns]: [CurrentUser, Profile[], string[], Column[]]) => {
        this.currentUser = currentUser
        this.profiles = profiles.filter((p) => p.inventory_type === this.displayType && p.profile_location === 'List View Profile')
        this.selectedProfileId = this.currentUser.settings.profile.list[this.type]
        this.profile = profiles.find((p) => p.id === this.selectedProfileId)
        this.selectedCycleIds = this.currentUser.settings.crossCycles[this.type] ?? [this.cycles[0].cycle_id]
        this.matchingColumns = new Set(matchingColumns)
        this.columnMap = new Map(columns.map((c) => [c.column_name, c.name]))
      }),
      switchMap(() => this.setGrid()),
    )
  }

  setGrid() {
    return EMPTY
    // DEVELOPER NOTE: Cross cycles is not yet implemented. This is a placeholder for the future
    // return this._inventoryService.filterByCycle(this.orgId, this.selectedProfileId, this.selectedCycleIds, this.type).pipe(
    //   filter((dataByCycle: Record<number, Record<string, unknown>[]>) => {
    //     const noData = !dataByCycle
    //     const emptyData = dataByCycle[Object.keys(dataByCycle)[0]]?.length === 0
    //     return !noData && !emptyData
    //   }),
    //   tap((dataByCycle) => {
    //     this.setColumnDefs()
    //     this.setRowData(dataByCycle)
    //   }),
    // )
  }

  setColumnDefs() {
    this.columnDefs = this.profile.columns.map((c) => ({
      field: this.columnMap.get(c.column_name),
      headerName: c.display_name,
      filter: true,
      sortable: true,
      resizable: true,
      pinned: this.matchingColumns.has(c.column_name) ? true : false,
    }))
    this.columnDefs.unshift({ field: 'id', hide: true, rowGroup: true })
  }

  setRowData(dataByCycle: Record<number, Record<string, unknown>[]>) {
    this.rowData = []
    // TEMPORARY: remove this when we have a better way to show cross cycles
    this.rowData = dataByCycle[this.selectedCycleIds[0]]
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api
  }

  updateOrgUserSettings() {
    return this._organizationService.updateOrganizationUser(this.currentUser.org_user_id, this.orgId, this.currentUser.settings)
  }

  onSelectCycleClosed() {
    this.currentUser.settings.crossCycles[this.type] = this.selectedCycleIds
    this.updateOrgUserSettings()
      .pipe(switchMap(() => this.setGrid()))
      .subscribe()
  }

  onSelectProfile() {
    this.currentUser.settings.profile.list[this.type] = this.selectedProfileId
    this.updateOrgUserSettings()
      .pipe(switchMap(() => this.setGrid()))
      .subscribe()
  }
}
