import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import type { MatSelectChange } from '@angular/material/select'
import { MatSelectModule } from '@angular/material/select'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatTooltipModule } from '@angular/material/tooltip'
import { ActivatedRoute } from '@angular/router'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { ColDef, GridApi, GridOptions, GridReadyEvent, ICellRendererParams, RowSelectedEvent } from 'ag-grid-community'
import { combineLatest, filter, Subject, switchMap, takeUntil, tap } from 'rxjs'
import type { Column } from '@seed/api/column'
import { ColumnService } from '@seed/api/column'
import { InventoryService } from '@seed/api/inventory'
import type { OrganizationUserSettings } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import type { CurrentUser } from '@seed/api/user'
import { UserService } from '@seed/api/user'
import { PageComponent } from '@seed/components'
import { ConfigService } from '@seed/services'
import { naturalSort } from '@seed/utils'
import { ModalComponent } from 'app/modules/column-list-profile/modal/modal.component'
import type { InventoryDisplayType, InventoryType, Profile, ProfileColumn, ProfileModalMode } from 'app/modules/inventory/inventory.types'

@Component({
  selector: 'seed-inventory-list-profiles',
  templateUrl: './column-list-profiles.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    CommonModule,
    PageComponent,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSidenavModule,
    MatTooltipModule,
    ModalComponent,
  ],
})
export class ColumnListProfilesComponent implements OnDestroy, OnInit {
  private _configService = inject(ConfigService)
  private _columnService = inject(ColumnService)
  private _dialog = inject(MatDialog)
  private _inventoryService = inject(InventoryService)
  private _organizationService = inject(OrganizationService)
  private _route = inject(ActivatedRoute)
  private _userService = inject(UserService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  columnDefs: ColDef[] = []
  columns: Column[]
  currentProfile: Profile
  currentUser: CurrentUser
  displayType: InventoryDisplayType
  gridApi: GridApi
  gridTheme$ = this._configService.gridTheme$
  orgId: number
  orgUserId: number
  pageTitle: string
  profiles: Profile[]
  rowData: ProfileColumn[] = []
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
    this.displayType = this.type === 'taxlots' ? 'Tax Lot' : 'Property'
    this.pageTitle = this.type === 'taxlots' ? 'Tax Lot Column Profiles' : 'Property Column Profiles'
    this.initPage()
  }

  initPage() {
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
        this.profiles = profiles.filter((p) => p.inventory_type === this.displayType)
        this.setProfile()
      }),
    )
  }

  setProfile() {
    const { org_user_id, settings } = this.currentUser
    this.orgUserId = org_user_id
    this.userSettings = settings

    if (!settings.profile) return

    const userProfileId = settings.profile.detail[this.type]
    this.currentProfile = this.profiles.find((p) => p.id === userProfileId) ?? this.profiles[0]
    this.userSettings.profile.detail[this.type] = this.currentProfile?.id
    this.updateOrgUserSettings().subscribe()
  }

  updateOrgUserSettings() {
    return this._organizationService.updateOrganizationUser(this.orgUserId, this.orgId, this.userSettings)
  }

  setGrid() {
    this.setColumnDefs()
    // use current profile if it exists, otherwise use all canonical columns
    const selectedCols = this.currentProfile?.columns ?? this.columns.filter((c) => !c.is_extra_data && !c.derived_column)
    const selectedColIds = new Set(selectedCols.map((c: { id: number }) => c.id))
    this.setRowData(selectedColIds)
  }

  setColumnDefs() {
    this.columnDefs = [
      { field: 'column_name', hide: true },
      { field: 'display_name', headerName: 'Column Name', cellRenderer: this.columnRenderer },
      { field: 'derived_column', hide: true },
      { field: 'id', hide: true },
      { field: 'name', hide: true },
      { field: 'order', hide: true },
      { field: 'pinned', hide: true },
      { field: 'table_name', hide: true },

    ]
  }

  columnRenderer = (params: ICellRendererParams): string | number | null => {
    const data = params.data as ProfileColumn
    const value = params.value as string
    return !data.derived_column
      ? value
      : `
          <span style="display:inline-flex; align-items:center;">
            <span class="ag-icon ag-icon-linked" style="font-size: 16px; margin-right: 4px;"></span>
              ${value}
            </span>
        `
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
    let [selectedRows, unselectedRows]: [ProfileColumn[], ProfileColumn[]] = [[], []]

    let idx = 0
    for (const col of this.columns) {
      const { column_name, derived_column, display_name, id, name, table_name } = col
      const data: ProfileColumn = {
        column_name,
        display_name,
        id,
        name,
        table_name,
        order: undefined,
        pinned: undefined,
      }

      if (derived_column) {
        data.derived_column = derived_column
      }

      if (selectedColIds.has(col.id)) {
        idx += 1
        data.order = idx
        data.pinned = false
        data.selected = true
        selectedRows.push(data)
      } else {
        unselectedRows.push(data)
      }
    }

    selectedRows = selectedRows.sort((a, b) => naturalSort(a.display_name, b.display_name))
    unselectedRows = unselectedRows.sort((a, b) => naturalSort(a.display_name, b.display_name))
    this.rowData = [...selectedRows, ...unselectedRows]

    if (this.gridApi) {
      setTimeout(() => {
        this.setSelectedRows()
      }, 0)
    }
  }

  onGridReady(agGrid: GridReadyEvent) {
    this.gridApi = agGrid.api
    this.gridApi.sizeColumnsToFit()
    this.setSelectedRows()

    // this.gridApi.addEventListener('cellClicked', this.onCellClicked.bind(this) as (event: CellClickedEvent) => void)
  }

  setSelectedRows() {
    this.gridApi.forEachNode((node) => {
      // setSelected takes 2 args: selected & clearOtherSelections. Without 2nd arg, unselected appears as [-] not [ ]
      const selectionArgs: [boolean, boolean] = (node.data as ProfileColumn).selected ? [true, null] : [false, true]
      node.setSelected(...selectionArgs)
    })
  }

  onRowSelected(event: RowSelectedEvent) {
    if (event.source !== 'api') {
      const selectedRows = new Set(this.gridApi.getSelectedRows().map((r: ProfileColumn) => r.id))
      this.setRowData(selectedRows)
    }
  }

  selectProfile(event: MatSelectChange) {
    const profileId: number = event.value as number
    const profile = this.profiles.find((p) => p.id === profileId)
    this.currentProfile = profile
    this.setRowData(new Set(profile.columns.map((c) => c.id)))
  }

  openProfileModal(mode: ProfileModalMode, columns: ProfileColumn[] = []) {
    const profile = mode === 'create' ? null : this.currentProfile
    const dialogRef = this._dialog.open(ModalComponent, {
      width: '40rem',
      data: {
        columns,
        cycleId: null,
        inventoryType: this.type,
        location: 'List View Profile',
        mode,
        orgId: this.orgId,
        profile,
        profiles: this.profiles,
        type: this.type === 'taxlots' ? 'Tax Lot' : 'Property',
      },
    })

    let newProfileId: number

    dialogRef.afterClosed().pipe(
      filter((id) => !!id),
      switchMap(() => this._inventoryService.getColumnListProfiles('List View Profile', this.type)),
      tap((profiles) => {
        this.profiles = profiles.filter((p) => p.inventory_type === this.displayType)
        this.currentProfile = this.profiles.find((p) => p.id === newProfileId) ?? this.profiles[0] ?? null
        this.userSettings.profile.list[this.type] = this.currentProfile?.id
        this.setGrid()
      }),
      switchMap(() => this.updateOrgUserSettings()),
    ).subscribe()
  }

  onSave = () => {
    if (!this.currentProfile) {
      this.openProfileModal('create', this.gridApi.getSelectedRows() as ProfileColumn[])
      return
    }

    const data = { ...this.currentProfile, columns: this.gridApi.getSelectedRows() }
    this._inventoryService.updateColumnListProfile(this.orgId, this.currentProfile.id, data).subscribe()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
