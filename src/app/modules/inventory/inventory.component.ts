import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { type MatSelect, MatSelectModule } from '@angular/material/select'
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
import { InventoryGridComponent, InventoryGridControlsComponent } from './grid'
import type { AgFilterResponse, FiltersSorts, InventoryPagination, InventoryType, Profile } from './inventory.types'
import { DeleteModalComponent, MoreActionsModalComponent } from './modal'

@Component({
  selector: 'seed-inventory',
  templateUrl: './inventory.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
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
    InventoryGridControlsComponent,
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
  private _orgId: number = null
  private _dialog = inject(MatDialog)
  private readonly _unsubscribeAll$ = new Subject<void>()
  readonly tabs: InventoryType[] = ['properties', 'taxlots']
  readonly type = this._activatedRoute.snapshot.paramMap.get('type') as InventoryType
  chunk = 100
  columnDefs: ColDef[]
  cycle: Cycle
  cycleId: number
  cycles: Cycle[]
  gridApi: GridApi
  labelLookup: Record<number, Label> = {}
  filters: string[][] | [] = []
  page = 1
  pagination: InventoryPagination
  profile: Profile
  profileId: number
  allProfiles: Profile[]
  properties: Record<string, unknown>[]
  propertyColumns: Column[]
  propertyProfiles: Profile[]
  taxlotProfiles: Profile[]
  rowData: Record<string, unknown>[]
  selectedViewIds: number[] = []
  sorts: string[] = []
  taxlotColumns: Column[]

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
    this._orgId = org_id

    return forkJoin({
      cycles: this._cycleService.get(this._orgId),
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
    this.cycle = cycles.at(2) ?? null
    this.cycleId = this.cycle?.id

    // this.allProfiles = profiles
    this.propertyProfiles = profiles.filter((p) => p.inventory_type === 0)
    this.taxlotProfiles = profiles.filter((p) => p.inventory_type === 1)
    this.propertyColumns = propertyColumns

    for (const label of labels) {
      this.labelLookup[label.id] = label
    }

    const id = this.profiles.length ? this.profiles[0].id : null
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
    const params = new URLSearchParams({
      cycle: this.cycleId.toString(),
      ids_only: 'false',
      include_related: 'true',
      organization_id: this._orgId.toString(),
      page: this.page.toString(),
      per_page: this.chunk.toString(),
    })

    // Add multiple order_by params dynamically
    for (const sort of this.sorts) params.append('order_by', sort)
    // Add filters. Filters are represented as [[k, v], [k, v]]. No filters represented as []
    if (this.filters.length && this.filters[0].length) {
      for (const [k, v] of this.filters) params.append(k, v)
    }

    const paramString = params.toString()
    const data = {
      include_property_ids: null,
      profile_id: this.profileId,
    }
    this._inventoryService.getAgInventory(this.type, paramString, data).subscribe(({ pagination, results, column_defs }: AgFilterResponse) => {
      this.pagination = pagination
      this.properties = results
      this.columnDefs = column_defs
      this.rowData = results
    })
  }

  onPageChange(page: number) {
    this.page = page
    this.loadInventory()
  }

  onFilterSortChange({ filters, sorts }: FiltersSorts) {
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

  // SHOULD ACTIONS BE ITS OWN COMPONENT?
  get actions() {
    return [
      { name: 'Select All', action: () => { this.selectAll() }, disabled: false },
      { name: 'Select None', action: () => { this.deselectAll() }, disabled: false },
      { name: 'Only Show Populated Columns', action: () => { this.tempAction() }, disabled: !this.properties },
      { name: 'Delete', action: this.deletePropertyStates, disabled: !this.selectedViewIds.length },
      { name: 'Merge', action: this.tempAction, disabled: !this.selectedViewIds.length },
      { name: 'More...', action: () => { this.openMoreActionsModal() }, disabled: !this.selectedViewIds.length },
    ]
  }

  tempAction() {
    console.log('temp action')
  }

  openMoreActionsModal() {
    this._dialog.open(MoreActionsModalComponent, {
      width: '40rem',
      autoFocus: false,
      data: { viewIds: this.selectedViewIds, orgId: this._orgId },
    })
  }

  onAction(action: () => void, select: MatSelect) {
    action()
    select.value = null
  }

  selectAll() {
    this.gridApi.selectAll()
    const params = new URLSearchParams({
      cycle: this.cycleId.toString(),
      ids_only: 'true',
      include_related: 'true',
      organization_id: this._orgId.toString(),
    })
    const paramString = params.toString()
    this._inventoryService.getAgInventory(this.type, paramString, {}).subscribe(({ results }: { results: number[] }) => {
      this.selectedViewIds = results
    })
  }

  deselectAll() {
    this.gridApi.deselectAll()
  }

  deletePropertyStates = () => {
    const dialogRef = this._dialog.open(DeleteModalComponent, {
      width: '40rem',
      data: { orgId: this._orgId, viewIds: this.selectedViewIds },
    })

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => { this.loadInventory() }),
      )
      .subscribe()
  }

  // openShowPopulatedColumnsModal() {
  //   // if (!this.profiles.length) {
  //   //   this.newProfile().subscribe(() => this.openPopulatedColumnsModal());
  //   // } else {
  //   //   this.openPopulatedColumnsModal();
  //   // }
  // }

  openShowPopulatedColumnsModal() {
    this._dialog.open(MoreActionsModalComponent, {
      width: '40rem',
      autoFocus: false,
      data: { viewIds: this.selectedViewIds, orgId: this._orgId },
    })
  }

  // ^^ ACTIONS

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
