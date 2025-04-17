import { CommonModule } from '@angular/common'
import type { OnChanges, OnDestroy, SimpleChanges } from '@angular/core'
import { Component, inject, Input } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressBar } from '@angular/material/progress-bar'
import { Router } from '@angular/router'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { ColDef, FirstDataRenderedEvent, GridApi, GridReadyEvent } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { finalize, forkJoin, map, type Observable, switchMap, take, tap } from 'rxjs'
import type { GenericColumn } from '@seed/api/column'
import { type Column, ColumnService } from '@seed/api/column'
import { InventoryService } from '@seed/api/inventory'
import type { OrganizationUser, OrganizationUserSettings } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import type { CurrentUser } from '@seed/api/user'
import { UserService } from '@seed/api/user'
import { ConfigService } from '@seed/services'
import { naturalSort } from '@seed/utils'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import type { InventoryType, Profile, ProfileColumn, State, ValueGetterParamsData, ViewResponse } from '../../inventory.types'
import { EditStateModalComponent } from '../modal/edit-state.component'

ModuleRegistry.registerModules([AllCommunityModule])

@Component({
  selector: 'seed-inventory-detail-history',
  templateUrl: './history-grid.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBar,
  ],
})
export class HistoryGridComponent implements OnChanges, OnDestroy {
  @Input() matchingColumns: string[]
  @Input() orgId: number
  @Input() type: InventoryType
  @Input() view: ViewResponse
  @Input() viewId: number
  private _columnService = inject(ColumnService)
  private _configService = inject(ConfigService)
  private _dialog = inject(MatDialog)
  private _inventoryService = inject(InventoryService)
  private _organizationService = inject(OrganizationService)
  private _router = inject(Router)
  private _snackBar = inject(SnackBarService)
  private _userService = inject(UserService)
  allColumns: Column[]
  columnDefs: ColDef[]
  columns: Column[]
  profileColumns: ProfileColumn[]
  currentProfile: Profile
  currentUser: CurrentUser
  derivedColumnNames: Set<string>
  extraDataColumnNames: Set<string>
  gridApi: GridApi
  gridColumns: (Column | ProfileColumn)[]
  gridTheme$ = this._configService.gridTheme$
  loading = false
  orgUserId: number
  profiles: Profile[]
  rowData: Record<string, unknown>[]
  viewCopy: ViewResponse
  userSettings: OrganizationUserSettings
  userProfileId: number

  defaultProfile = {
    detail: { taxlots: null, properties: null },
    list: { taxlots: null, properties: null },
  }

  defaultColDef = {
    sortable: false,
    filter: false,
    resizable: true,
    suppressMovable: true,
  }

  /*
  * what columns are we using? if theres a profile use those, if theres no profile use all columns.
  * could do a fork join but might be unnecessary
  * so start with best case which is a profile
  * also need user settings?
  */

  getHistory() {
    return this.getProfileColumns().pipe(
      tap((results) => {
        this.setProfileColumns(results)
      }),
      switchMap(() => this.updateOrgUserSettings()),
      tap(() => {
        this.setColumnDefs()
        this.setRowData()
      }),
    )
  }

  getProfileColumns() {
    const columns$ = this.type === 'taxlots' ? this._columnService.taxLotColumns$ : this._columnService.propertyColumns$
    return forkJoin({
      columns: columns$.pipe(take(1)),
      currentUser: this._userService.currentUser$.pipe(take(1)),
      profiles: this._inventoryService.getColumnListProfiles('Detail View Profile', this.type),
    })
  }

  /*
  * 1. find current profile
  * 2. if no profile, set to null
  * 3. set columns to current profile columns or all canonical columns

  */
  setProfileColumns({ columns, currentUser, profiles }: { columns: Column[]; currentUser: CurrentUser; profiles: Profile[] }) {
    this.columns = columns
    this.getProfile(currentUser, profiles)
    this.setGridColumns()
  }

  getProfile(currentUser: CurrentUser, profiles: Profile[]) {
    this.currentUser = currentUser
    this.profiles = profiles

    const { org_user_id, settings } = currentUser
    this.orgUserId = org_user_id
    this.checkUserProfileSettings(settings)
    this.userProfileId = settings.profile.detail[this.type]

    this.currentProfile = profiles.find((p) => p.id === this.userProfileId) ?? this.profiles[0]
    this.userSettings.profile.detail[this.type] = this.currentProfile?.id
  }

  setGridColumns() {
    if (this.currentProfile?.columns) {
      this.gridColumns = this.currentProfile.columns
    } else {
      this.gridColumns = this.columns.filter((c) => !c.is_extra_data)
    }
    this.derivedColumnNames = new Set(this.columns.filter((c) => c.derived_column).map((c) => c.column_name))
    this.extraDataColumnNames = new Set(this.columns.filter((c) => c.is_extra_data).map((c) => c.column_name))
  }

  checkUserProfileSettings(settings: OrganizationUserSettings) {
    this.userSettings = settings
    this.userSettings.profile = this.userSettings.profile || {}
    this.userSettings.profile.detail = this.userSettings.profile.detail || {}
    this.userSettings.profile.detail[this.type] = this.userSettings.profile.detail[this.type] || null
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.view) {
      this.getHistory().subscribe()
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api
  }

  onFirstDataRendered(params: FirstDataRenderedEvent) {
    params.api.sizeColumnsToFit()
  }

  get gridHeight() {
    if (!this.rowData) return
    return Math.min(this.rowData.length * 70, 500)
  }

  setColumnDefs() {
    this.columnDefs = [
      {
        field: 'field',
        headerName: 'Field',
        pinned: true,
        cellRenderer: ({ value }: { value: string }) => {
          // add 'link' icon to derived columns
          const isDerived = this.derivedColumnNames.has(value)
          return !isDerived
            ? value
            : `
                <span style="display:inline-flex; align-items:center;">
                  <span class="ag-icon ag-icon-linked" style="font-size: 16px; margin-right: 4px;"></span>
                    ${value}
                 </span>
              `
        },
      },
      {
        field: 'state',
        headerName: 'Main',
      },
    ]

    for (const { filename } of this.view.history) {
      // field names with periods require formatting, otherwise treated as a path
      this.columnDefs.push({
        field: filename,
        headerName: filename,
        valueGetter: (params: ValueGetterParamsData) => params.data[filename],
      })
    }
  }

  setRowData() {
    // Transposed data. Each row is a column name (address line 1, address line 2, etc.)
    this.rowData = []
    const columnsSorted: GenericColumn[] = this.gridColumns.sort((a, b) => naturalSort(a.display_name, b.display_name))

    for (const { column_name, display_name } of columnsSorted) {
      const isExtraData = this.extraDataColumnNames.has(column_name)
      let value = isExtraData ? this.view.state.extra_data[column_name] : this.view.state[column_name]
      const row = { field: display_name, state: value }
      for (const item of this.view.history) {
        value = isExtraData ? item.state.extra_data[column_name] : item.state[column_name]
        row[item.filename] = value
      }
      this.rowData.push(row)
    }
  }

  editMain() {
    this.viewCopy = JSON.parse(JSON.stringify(this.view)) as ViewResponse

    const dialogRef = this._dialog.open(EditStateModalComponent, {
      autoFocus: false,
      disableClose: true,
      width: '50rem',
      maxHeight: '75vh',
      data: { columns: this.gridColumns, orgId: this.orgId, view: this.view, matchingColumns: this.matchingColumns },
      panelClass: 'seed-dialog-panel',
    })

    dialogRef.afterClosed().pipe(
      tap((message) => {
        if (message !== 'matchMerge') return

        const updated = JSON.stringify(this.viewCopy) !== JSON.stringify(this.view)
        if (updated) this.saveItem()
        else this._snackBar.info('No changes detected')
      }),
    ).subscribe()
  }

  /*
  * save the user's changes to the Property/TaxLot State object.
  */
  saveItem() {
    const updatedFields = this.checkStateDifference(this.view.state, this.viewCopy.state)
    this.loading = true
    this._inventoryService.updateInventory(this.orgId, this.viewId, this.type, updatedFields).pipe(
      tap((response) => { void this._router.navigateByUrl(`${this.type}/${response.view_id}`) }),
      finalize(() => this.loading = false),
    ).subscribe()
  }

  checkStateDifference(state: State, stateCopy: State): Record<string, unknown> {
    const updatedFields = {}
    for (const field in state) {
      if (field === 'extra_data') {
        this.checkExtraDataDifference(state.extra_data, stateCopy.extra_data, updatedFields)
        continue
      }

      if (typeof state[field] === 'object') continue

      if (state[field] !== stateCopy[field]) {
        updatedFields[field] = state[field]
      }
    }
    return updatedFields
  }

  checkExtraDataDifference(extraData: Record<string, unknown>, extraDataCopy: Record<string, unknown>, updatedFields: Record<string, unknown>) {
    for (const field in extraData) {
      if (extraData[field] !== extraDataCopy[field]) {
        updatedFields[field] = extraData[field]
      }
    }
  }

  updateOrgUserSettings(): Observable<OrganizationUser> {
    return this._organizationService.updateOrganizationUser(this.orgUserId, this.orgId, this.userSettings).pipe(
      map((response) => response.data),
      tap(({ settings }) => {
        this.userSettings = settings
      }),
    )
  }

  ngOnDestroy(): void {
    console.log('destroy history')
  }
}
