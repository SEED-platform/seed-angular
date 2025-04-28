import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { ActivatedRoute } from '@angular/router'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { CellClickedEvent, ColDef, GridApi, GridOptions, GridReadyEvent, RowSelectedEvent } from 'ag-grid-community'
import { combineLatest, Subject, switchMap, takeUntil, tap } from 'rxjs'
import type { Column } from '@seed/api/column'
import { ColumnService } from '@seed/api/column'
import { InventoryService } from '@seed/api/inventory'
import type { OrganizationUserSettings } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import type { CurrentUser } from '@seed/api/user'
import { UserService } from '@seed/api/user'
import { PageComponent } from '@seed/components'
import { ConfigService } from '@seed/services'
import type { InventoryType, Profile } from 'app/modules/inventory/inventory.types'
import { naturalSort } from '@seed/utils'

@Component({
  selector: 'seed-inventory-list-profiles',
  templateUrl: './column-list-profiles.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    CommonModule,
    PageComponent,
    MatButtonModule,
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
        const inventoryType = this.type === 'taxlots' ? 'Tax Lot' : 'Property'
        this.profiles = profiles.filter((p) => p.inventory_type === inventoryType)
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
    // this.updateOrgUserSettings().subscribe()
  }

  // NOT USED YET - maybe need to pass id and settings as args
  updateOrgUserSettings() {
    const { org_user_id, settings } = this.currentUser
    return this._organizationService.updateOrganizationUser(org_user_id, this.orgId, settings)
  }

  setGrid() {
    this.setColumnDefs()
    const selectedColIds = new Set(this.currentProfile.columns.map((c) => c.id))
    console.log('setGrid')
    this.setRowData(selectedColIds)
  }

  setColumnDefs() {
    this.columnDefs = [
      { field: 'id', hide: true },
      { field: 'display_name', headerName: 'Column Name' },
    ]
  }

  // pinRenderer = () => {
  //   return `
  //     <span 
  //       style="opacity: 0.4"
  //       class="material-icons-outlined action-icon cursor-pointer"
  //     >
  //       push_pin
  //     </span>
  //   `
  // }

  /**
   * Place selected rows (profile columns) at the top of the grid
   */
  setRowData(selectedColIds: Set<number>) {
    console.log('setRowData')

    let [selectedRows, unselectedRows] = [[], []]

    for (const col of this.columns) {
      const isSelected = selectedColIds.has(col.id)
      const arr = isSelected ? selectedRows : unselectedRows
      arr.push({ display_name: col.display_name, column_name: col.column_name, id: col.id, selected: isSelected })
    }

    selectedRows = selectedRows.sort((a, b) => naturalSort(a.display_name, b.display_name))
    unselectedRows = unselectedRows.sort((a, b) => naturalSort(a.display_name, b.display_name))
    this.rowData = [...selectedRows, ...unselectedRows]
  }

  onGridReady(agGrid: GridReadyEvent) {
    console.log('onGridReady')
    this.gridApi = agGrid.api
    this.gridApi.sizeColumnsToFit()
    this.setSelectedRows()

    // this.gridApi.addEventListener('cellClicked', this.onCellClicked.bind(this) as (event: CellClickedEvent) => void)
  }

  setSelectedRows() {
    console.log('setSelectedRows')
    this.gridApi.forEachNode((node) => {
      // setSelected takes 2 args: selected & clearOtherSelections. Without 2nd arg, unselected appears as [-] not [ ]
      const selectionArgs: [boolean, boolean] = node.data.selected ? [true, null] : [false, true]
      node.setSelected(...selectionArgs)
    })
  }

  onRowSelected(event: RowSelectedEvent) {
    if (event.source !== 'api') {
      const selectedRows = new Set(this.gridApi.getSelectedRows().map((r) => r.id as number))
      console.log('onRowSelect', selectedRows)
      this.setRowData(selectedRows)
      setTimeout(() => {
        this.setSelectedRows()
      }, 0)
    }
  }

  get gridHeight() {
    const headerHeight = 50
    const gridHeight = this.rowData.length * 42 + headerHeight
    return Math.min(gridHeight, 1000)
  }

  action() {
    console.log('reset')
    this.setRowData(new Set(this.currentProfile.columns.map((c) => c.id)))
    this.setSelectedRows()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
