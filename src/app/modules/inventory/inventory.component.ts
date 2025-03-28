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
import { forkJoin, of, Subject, switchMap, take, takeUntil, tap } from 'rxjs'
import type { Column } from '@seed/api/column'
import { ColumnService } from '@seed/api/column'
import type { Cycle } from '@seed/api/cycle'
import { CycleService } from '@seed/api/cycle/cycle.service'
import { InventoryService } from '@seed/api/inventory'
import type { Label } from '@seed/api/label'
import { LabelService } from '@seed/api/label'
import { OrganizationService } from '@seed/api/organization'
import { InventoryTabComponent, PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { ActionsComponent, ConfigSelectorComponent, FilterSortChipsComponent, InventoryGridComponent } from './grid'
// import { CellHeaderMenuComponent } from './grid/cell-header-menu.component'
import type { AgFilterModel, AgFilterResponse, FiltersSorts, InventoryPagination, InventoryType, Profile } from './inventory.types'

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
  private _columnService = inject(ColumnService)
  private _labelService = inject(LabelService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  readonly tabs: InventoryType[] = ['properties', 'taxlots']
  readonly type = this._activatedRoute.snapshot.paramMap.get('type') as InventoryType
  filters: AgFilterModel = {}
  chunk = 100
  columnDefs: ColDef[]
  cycle: Cycle
  cycleId: number
  cycles: Cycle[]
  gridApi: GridApi
  labelLookup: Record<number, Label> = {}
  inventory: Record<string, unknown>[]
  orgId: number = null
  page = 1
  pagination: InventoryPagination
  profile: Profile
  profileId: number
  allProfiles: Profile[]
  propertyColumns: Column[]
  propertyProfiles: Profile[]
  taxlotProfiles: Profile[]
  rowData: Record<string, unknown>[]
  selectedViewIds: number[] = []
  sorts: string[] = []
  taxlotColumns: Column[]

  chipList = ['chip1', 'chip2', 'chip3', 'chip4', 'chip5', 'chip6', 'chip7', 'chip8', 'chip9', 'chip10']

  ngOnInit(): void {
    this._organizationService.currentOrganization$.pipe(
      takeUntil(this._unsubscribeAll$),
      switchMap(({ org_id }) => {
        return this.getDependencies(org_id)
      }),
    ).subscribe()
  }

  onGridReady(gridApi: GridApi) {
    this.gridApi = gridApi
  }

  onSelectionChanged() {
    this.selectedViewIds = this.gridApi.getSelectedRows().map(({ property_view_id }: { property_view_id: number }) => property_view_id)
  }

  /*
  * get cycles, profiles, columns, inventory
  */
  getDependencies(org_id: number) {
    this.orgId = org_id

    return forkJoin({
      cycles: this._cycleService.get(this.orgId),
      profiles: this._inventoryService.getColumnListProfiles('List View Profile', 'properties', true),
      propertyColumns: this._columnService.propertyColumns$.pipe(take(1)),
      labels: this._labelService.labels$.pipe(take(1)),
    }).pipe(
      tap((results) => { this.setDependencies(results) }),
    )
  }

  /*
  * set class variables: cycles, profiles, columns, inventory
  */
  setDependencies({ cycles, profiles, propertyColumns, labels }: { cycles: Cycle[]; profiles: Profile[]; propertyColumns: Column[]; labels: Label[] }) {
    this.cycles = cycles
    // TEMP - remove when cycle is set in backend
    this.cycle = cycles.at(3) ?? null
    this.cycleId = this.cycle?.id

    // this.allProfiles = profiles
    this.propertyProfiles = profiles.filter((p) => p.inventory_type === 0)
    this.taxlotProfiles = profiles.filter((p) => p.inventory_type === 1)
    this.propertyColumns = propertyColumns

    for (const label of labels) {
      this.labelLookup[label.id] = label
    }
    // TEMP - remove when profile is se tin backend
    const id = this.profiles.length ? this.profiles[3].id : null
    this.getProfile(id)
  }
  get profiles() {
    return this.type === 'properties' ? this.propertyProfiles : this.taxlotProfiles
  }

  /*
  * get profile and reload inventory
  */
  getProfile(id: number) {
    if (!id) {
      this.loadInventory()
      return
    }

    const profileRequest = id ? this._inventoryService.getColumnListProfile(id) : of(null)
    profileRequest.subscribe((profile) => {
      this.profile = profile
      this.profileId = profile.id
      this.loadInventory()
    })
  }

  onProfileChange(id: number) {
    this.getProfile(id)
  }

  onCycleChange(id: number) {
    this.cycleId = id
    this.cycle = this.cycles.find((cycle) => cycle.id === id)
    this.page = 1
    this.loadInventory()
  }

  /*
  * Loads inventory for the grid
  */
  loadInventory() {
    if (!this.cycleId) return
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

    const paramString = params.toString()
    const data = {
      include_property_ids: null,
      profile_id: this.profileId,
      filters: this.filters,
      sorts: this.sorts,
    }

    this._inventoryService.getAgInventory(paramString, data).subscribe(({ pagination, results, column_defs }: AgFilterResponse) => {
      this.pagination = pagination
      this.inventory = results

      this.columnDefs = column_defs
      // this.columnDefs = column_defs.map((colDef) => ({ ...colDef, headerComponent: CellHeaderMenuComponent }))
      this.rowData = results
    })
  }

  onPageChange(page: number) {
    this.page = page
    this.loadInventory()
  }

  onFilterSortChange({ sorts, filters }: FiltersSorts) {
    console.log('onFilterSortChange')
    this.filters = filters
    this.sorts = sorts
    this.page = 1
    this.loadInventory()
  }

  async toggleInventoryType(type: InventoryType) {
    if (type !== this.type) {
      // Hack to route to reload the current component
      await this._router.navigateByUrl('/', { skipLocationChange: true })
      await this._router.navigate([this.type === 'properties' ? 'taxlots' : 'properties'])
    }
  }

  openFilterSortModal() {
    console.log('open filter sort label')
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
