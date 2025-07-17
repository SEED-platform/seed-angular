import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, Input } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import type { MatSelectChange } from '@angular/material/select'
import { AgGridAngular } from 'ag-grid-angular'
import type { ColDef, GridApi, GridOptions, GridReadyEvent, RowSelectedEvent } from 'ag-grid-community'
import { combineLatest, filter, Subject, switchMap, takeUntil, tap } from 'rxjs'
import type { Column, CurrentUser } from '@seed/api'
import { ColumnService, InventoryService, OrganizationService, UserService } from '@seed/api'
import { DeleteModalComponent, PageComponent } from '@seed/components'
import { MaterialImports } from '@seed/materials'
import { ConfigService } from '@seed/services'
import { naturalSort } from '@seed/utils'
import { ModalComponent } from 'app/modules/column-list-profile/modal/modal.component'
import type { InventoryDisplayType, InventoryType, Profile, ProfileColumn, ProfileModalMode } from 'app/modules/inventory/inventory.types'

type CellRendererParams = { value: string; data: { derived_column: number; is_extra_data: boolean } }
@Component({
  selector: 'seed-column-profiles',
  templateUrl: './column-profiles.component.html',
  imports: [
    AgGridAngular,
    CommonModule,
    PageComponent,
    MaterialImports,
    ModalComponent,
  ],
})
export class ColumnProfilesComponent implements OnDestroy, OnInit {
  @Input() profileType: 'list' | 'detail'
  @Input() type: InventoryType
  private _configService = inject(ConfigService)
  private _columnService = inject(ColumnService)
  private _dialog = inject(MatDialog)
  private _inventoryService = inject(InventoryService)
  private _organizationService = inject(OrganizationService)
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
  profiles: Profile[]
  profileLocation: 'List View Profile' | 'Detail View Profile'
  updateCLP$ = new Subject<unknown>()
  updateOrgUserSettings$ = new Subject<void>()
  rowData: ProfileColumn[] = []

  gridOptions: GridOptions = {
    rowSelection: {
      mode: 'multiRow',
      checkboxes: true,
      headerCheckbox: true,
    },
    onRowSelected: (event) => {
      this.onRowSelected(event)
    },
  }

  defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    suppressMovable: true,
    floatingFilter: true,
  }

  ngOnInit(): void {
    this.profileLocation = this.profileType === 'list' ? 'List View Profile' : 'Detail View Profile'
    this.displayType = this.type === 'taxlots' ? 'Tax Lot' : 'Property'
    this.initPage()
  }

  initPage() {
    this.getDependencies()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => {
          this.setGrid()
          this.initStreams()
        }),
      )
      .subscribe()
  }

  initStreams() {
    this.updateCLP$
      .pipe(
        filter(Boolean),
        takeUntil(this._unsubscribeAll$),
        switchMap((data) => this._inventoryService.updateColumnListProfile(this.orgId, this.currentProfile.id, data)),
        tap(() => {
          this.initPage()
        }),
      )
      .subscribe()

    this.updateOrgUserSettings$
      .pipe(
        takeUntil(this._unsubscribeAll$),
        switchMap(() => this.updateOrgUserSettings()),
      )
      .subscribe()
  }

  getDependencies() {
    const columns$ = this.type === 'taxlots' ? this._columnService.taxLotColumns$ : this._columnService.propertyColumns$

    return combineLatest([this._userService.currentOrganizationId$, this._userService.currentUser$, columns$]).pipe(
      tap(([orgId, currentUser, columns]) => {
        this.orgId = orgId
        this.currentUser = currentUser
        this.columns = columns
      }),
      switchMap(() => this._inventoryService.getColumnListProfiles(this.profileLocation, this.type)),
      switchMap((profiles) => {
        this.profiles = profiles.filter((p) => p.inventory_type === this.displayType).sort((a, b) => naturalSort(a.name, b.name))
        return this.setProfile()
      }),
    )
  }

  setProfile() {
    if (!this.currentUser.settings.profile) return

    const userProfileId = this.currentUser.settings.profile[this.profileType][this.type]
    this.currentProfile = this.profiles.find((p) => p.id === userProfileId) ?? this.profiles[0]
    this.currentUser.settings.profile[this.profileType][this.type] = this.currentProfile?.id
    return this.updateOrgUserSettings()
  }

  updateOrgUserSettings() {
    return this._organizationService.updateOrganizationUser(this.currentUser.org_user_id, this.orgId, this.currentUser.settings)
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
      { field: 'is_extra_data', hide: true },
      { field: 'id', hide: true },
      { field: 'name', hide: true },
      { field: 'order', hide: true },
      { field: 'pinned', hide: true },
      { field: 'table_name', hide: true },
    ]
  }

  columnRenderer = (params: CellRendererParams) => {
    const value = params.value
    const { derived_column, is_extra_data } = params.data
    if (!derived_column && !is_extra_data) return value

    // add icon to extra data and derived columns
    const iconName = derived_column ? 'link' : is_extra_data ? 'emergency' : null
    const textSize = derived_column ? 'text-sm' : 'text-xs'
    return `${value} <span class="material-icons align-middle ml-1 mb-2 text-secondary ${textSize}">${iconName}</span>`
  }

  // pinRenderer = () => {
  //   return `
  //     <span
  //       style="opacity: 0.4"
  //       class="material-icons-outlined  cursor-pointer"
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
      const { column_name, derived_column, display_name, id, is_extra_data, name, table_name } = col
      const data = {
        column_name,
        display_name,
        derived_column: undefined,
        id,
        is_extra_data,
        name,
        order: undefined,
        pinned: undefined,
        selected: false,
        table_name,
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
    this.currentUser.settings.profile[this.profileType][this.type] = profileId
    this.currentProfile = profile
    this.setRowData(new Set(profile.columns.map((c) => c.id)))
    this.updateOrgUserSettings$.next()
  }

  openDeleteModal() {
    const dialogRef = this._dialog.open(DeleteModalComponent, {
      width: '40rem',
      data: { model: 'Column List Profile', instance: this.currentProfile.name },
    })

    dialogRef
      .afterClosed()
      .pipe(
        filter(Boolean),
        tap(() => {
          console.log('DEVELOPER NOTE: Delete function fails while in development mode, via a vite proxy error')
        }),
        switchMap(() => this._inventoryService.deleteColumnListProfile(this.orgId, this.currentProfile.id)),
        tap(() => {
          this.initPage()
        }),
      )
      .subscribe()
  }

  openProfileModal(mode: ProfileModalMode, columns: ProfileColumn[] = []) {
    const profile = mode === 'create' ? null : this.currentProfile
    const dialogRef = this._dialog.open(ModalComponent, {
      width: '40rem',
      data: {
        columns,
        cycleId: null,
        inventoryType: this.type,
        location: this.profileLocation,
        mode,
        orgId: this.orgId,
        profile,
        profiles: this.profiles,
        type: this.type === 'taxlots' ? 'Tax Lot' : 'Property',
      },
    })

    let newProfileId: number

    dialogRef
      .afterClosed()
      .pipe(
        filter((id: number) => {
          newProfileId = id
          return !!id
        }),
        switchMap(() => this._inventoryService.getColumnListProfiles(this.profileLocation, this.type)),
        tap((profiles) => {
          this.profiles = profiles.filter((p) => p.inventory_type === this.displayType)
          this.currentProfile = this.profiles.find((p) => p.id === newProfileId) ?? this.profiles[0] ?? null
          this.currentUser.settings.profile[this.profileType][this.type] = this.currentProfile?.id
          this.setGrid()
        }),
        switchMap(() => this.updateOrgUserSettings()),
      )
      .subscribe()
  }

  onSave = () => {
    if (!this.currentProfile) {
      this.openProfileModal('create', this.gridApi.getSelectedRows() as ProfileColumn[])
      return
    }

    const data = { ...this.currentProfile, columns: this.gridApi.getSelectedRows() }
    this.updateCLP$.next(data)
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
