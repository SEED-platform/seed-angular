import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import type { Column } from '@seed/api/column'
import { ColumnService } from '@seed/api/column'
import { InventoryService } from '@seed/api/inventory'
import type { OrganizationUserSettings } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import type { CurrentUser } from '@seed/api/user'
import { UserService } from '@seed/api/user'
import { PageComponent } from '@seed/components'
import { ConfigService } from '@seed/services'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { CellClickedEvent, ColDef, GridApi, GridOptions, GridReadyEvent, RowSelectedEvent } from 'ag-grid-community'
import type { InventoryType, Profile } from 'app/modules/inventory/inventory.types'
import { combineLatest, forkJoin, of, Subject, switchMap, take, takeUntil, tap } from 'rxjs'

@Component({
  selector: 'seed-inventory-list-profiles',
  templateUrl: './column-list-profiles.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    CommonModule,
    PageComponent,
  ],
})
export class ColumnListProfilesComponent implements OnDestroy, OnInit {
  private _configService = inject(ConfigService)
  private _columnService = inject(ColumnService)
  private _inventoryService = inject(InventoryService)
  private _organizationService = inject(OrganizationService)
  private _route = inject(ActivatedRoute)
  private _userService = inject(UserService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  columnDefs: ColDef[] = []
  columns: Column[]
  currentProfile: Profile
  currentUser: CurrentUser
  gridApi: GridApi
  gridTheme$ = this._configService.gridTheme$
  orgId: number
  orgUserId: number
  pageTitle: string
  profiles: Profile[]
  rowData: Record<string, unknown>[] = []
  type = this._route.snapshot.paramMap.get('type') as InventoryType
  userSettings: OrganizationUserSettings

  gridOptions: GridOptions = {
    rowSelection: {
      mode: 'multiRow',
      checkboxes: true,
      headerCheckbox: true,
    },
    // pinnedTopRowData: [
    //   { column_name: 'City'}
    // ],
    rowClassRules: {
      'even-row': (params) => params.node.rowIndex % 2 === 0,
    },
    onSelectionChanged: () => { this.onSelectionChanged() },
    onRowSelected: (event) => { this.onRowSelected(event) },
  }

  defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    suppressMovable: true,
  }

  ngOnInit(): void {
    this.pageTitle = this.type === 'taxlots' ? 'Tax Lot Column Profiles' : 'Property Column Profiles'
    this.getDependencies().pipe(
      tap(() => {
        this.setGrid()
      }),
    ).subscribe()
  }

  getDependencies() {
    return this._organizationService.currentOrganization$.pipe(
      takeUntil(this._unsubscribeAll$),
      tap(({ org_id }) => this.orgId = org_id),
      switchMap(() => {
        const columns$ = this.type === 'taxlots' ? this._columnService.taxLotColumns$ : this._columnService.propertyColumns$
        return combineLatest([
          columns$,
          this._userService.currentUser$,
          this._inventoryService.getColumnListProfiles('List View Profile', this.type),
        ])
      }),
      tap(([columns, currentUser, profiles]) => {
        this.columns = columns
        this.currentUser = currentUser
        this.profiles = profiles
        this.setProfile()
      }),
    )
  }

  setProfile() {
    const { org_user_id, settings } = this.currentUser
    this.orgUserId = org_user_id
    this.userSettings = settings
    const userProfileId = settings.profile.detail[this.type]

    this.currentProfile = this.profiles.find((p) => p.id === userProfileId) ?? this.profiles[0]
    this.userSettings.profile.detail[this.type] = this.currentProfile?.id
  }

  updateOrgUserSettings() {
    const { org_user_id, settings } = this.currentUser
    return this._organizationService.updateOrganizationUser(org_user_id, this.orgId, settings)
  }

  setGrid() {
    this.setColumnDefs()
    this.setRowData()
  }

  setColumnDefs() {
    this.columnDefs = [
      { field: 'id', hide: true },
      // { field: 'pin', cellRenderer: this.pinRenderer, width: 5 },
      { field: 'column_name', headerName: 'Column Name' },
    ]
  }

  pinRenderer = () => {
    return `
      <span 
        style="opacity: 0.4"
        class="material-icons-outlined action-icon cursor-pointer"
      >
        push_pin
      </span>
    `
  }
  setRowData() {
    const profileColumnNames = new Set(this.currentProfile.columns.map((c) => c.column_name))
    console.log('setGrid')
    for (const col of this.columns) {
      if (profileColumnNames.has(col.column_name)) {
        console.log('got it')
        this.rowData.push({ column_name: col.display_name, id: col.column_name, selected: true })
      } else {
        this.rowData.push({ column_name: col.display_name, id: col.column_name })
      }
    }
  }

  onGridReady(agGrid: GridReadyEvent) {
    this.gridApi = agGrid.api
    this.gridApi.sizeColumnsToFit()

    this.gridApi.forEachNode((node) => {
      if (node.data.selected)  {
        node.setSelected(true)
      }
    })
    this.gridApi.addEventListener('cellClicked', this.onCellClicked.bind(this) as (event: CellClickedEvent) => void)
  }

  onCellClicked(event: CellClickedEvent) {
    this.rowData = [{ column_name: 'test' }, ...this.rowData]
    console.log('onCellClicked', this.rowData.length)
    // if (event.colDef.field !== 'pin') return

    // event.data.pinned = !event.data.pinned

    // const target = event.event.target as HTMLElement
    // // toggle pin styles
    // target.classList.toggle('material-icons-outlined')
    // target.classList.toggle('material-icons')
    // target.style.opacity = target.classList.contains('material-icons') ? '1' : '0.1'
  }

  onRowSelected(event: RowSelectedEvent) {
    console.log('onRowSelected', event)

    // this.rowData.shift()
    // this.gridOptions.api.setRowData(this.rowData);
    // console.log('onRowSelected', event.data)
    // let { pinnedTopRowData } = this.gridOptions

    // if (pinnedTopRowData.includes(event.data)) {
    //   pinnedTopRowData = pinnedTopRowData.filter((row) => row !== event.data)
    // } else {
    //   pinnedTopRowData = [...pinnedTopRowData, event.data]
    // }

    // this.rowData.unshift(event.data)
  }

  get gridHeight() {
    const headerHeight = 50
    const gridHeight = this.rowData.length * 42 + headerHeight
    return Math.min(gridHeight, 1000)
  }

  onSelectionChanged() {
    // console.log('onSelectionChanged')
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
