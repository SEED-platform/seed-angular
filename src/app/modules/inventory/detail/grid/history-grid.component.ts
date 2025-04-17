import { CommonModule } from '@angular/common'
import type { OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core'
import { Component, inject, Input } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressBar } from '@angular/material/progress-bar'
import { Router } from '@angular/router'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { catchError, EMPTY, finalize, map, type Observable, of, switchMap, take, tap } from 'rxjs'
import { type Column, ColumnService } from '@seed/api/column'
import { InventoryService } from '@seed/api/inventory'
import { ConfigService } from '@seed/services'
import { naturalSort } from '@seed/utils'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import type { InventoryType, Profile, ProfileColumn, State, ValueGetterParamsData, ViewResponse } from '../../inventory.types'
import { EditStateModalComponent } from '../modal/edit-state.component'
import { CurrentUser, UserService } from '@seed/api/user'
import { OrganizationService, OrganizationUser, OrganizationUserSettings } from '@seed/api/organization'

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
  // columns: Column[]
  profileColumns: ProfileColumn[]
  currentProfile: Profile
  currentUser: CurrentUser
  derivedColumnNames: Set<string>
  gridApi: GridApi
  gridColumns: Column[]
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
    console.log('getHistory')
    return this.getProfiles().pipe(
      switchMap(() => this.getCurrentUser()),
      switchMap((profileColumns) => {
        const columns$ = this.type === 'taxlots' ? this._columnService.taxLotColumns$ : this._columnService.propertyColumns$
        return columns$
      }),
      tap((columns) => {
        console.log(columns)
      }),
      // switchMap(() => this.getColumns()),
      // switchMap(() => this.updateOrgUserSettings()),
    )
    // return this.getColumns().pipe(
    //   take(1),
    //   tap((columns) => {
    //     this.allColumns = columns
    //     this.setColumns(columns)
    //     this.setColumnDefs()
    //     this.setRowData()
    //   }),
    // )
  }

  getProfiles() {
    return this._inventoryService.getColumnListProfiles('Detail View Profile', this.type).pipe(
      tap((profiles) => { this.profiles = profiles }),
    )
  }

  getCurrentUser() {
    console.log('getCurrentUser')
    return this._userService.currentUser$.pipe(
      map((currentUser) => {
        const { org_user_id, settings }: { org_user_id: number; settings: OrganizationUserSettings } = currentUser
        this.currentUser = currentUser // may not be necessary
        this.orgUserId = org_user_id // for update org settings
        this.userSettings = settings
        this.setUserSettings(settings)
        this.userProfileId = settings.profile.detail[this.type]
        // set current profile if present
        if (this.profiles.length) {
          this.currentProfile = this.profiles.find((p) => p.id === this.userProfileId)
          this.profileColumns = this.currentProfile?.columns ?? []
        }
        if (!this.currentProfile) {
          // update user settings. not sure if i need a subscribe?
          this.userSettings.profile.detail[this.type] = null
          this.updateOrgUserSettings() // .pipe(take(1))
        }

        return this.profileColumns
      }),

    )
  }

  setUserSettings(settings: OrganizationUserSettings) {
    console.log('setUserSettings')
    this.userSettings = settings
    this.userSettings.profile = this.userSettings.profile || {}
    this.userSettings.profile.detail = this.userSettings.profile.detail || {}
    this.userSettings.profile.detail[this.type] = this.userSettings.profile.detail[this.type] || null
  }

  getColumns() {
    // columns will either be
    // 1. the current profile columns
    // 2. inventory type columns
    console.log('getProfiles')

    // if current profile, use that.
    if (this.userProfileId) {
      return this._inventoryService.getColumnListProfile(this.userProfileId).pipe(
        map((profile) => {
          console.log('p', profile)
          return profile
        }),
      )
    } else {
      console.log('else')
    }
    // if no current profile, assign the first profile
    return this._inventoryService.getColumnListProfiles('Detail View Profile', this.type).pipe(
      switchMap((profiles) => {
        if (profiles.length) {
          this.currentProfile = profiles[0]
          this.userProfileId = profiles[0].id
          return of(profiles[0].columns)
        } else {
          // if there are no profiles, just use inventory type columns
          console.log('no profiles')
          return this.type === 'taxlots' ? this._columnService.taxLotColumns$ : this._columnService.propertyColumns$
        }
      }),
    )
  }

  // setProfile(profiles: Profile[]) {
  //   console.log('setProfile', profiles)
  //   if (!this.currentProfile && profiles?.length) {
  //     this.currentProfile = profiles[0]
  //     this.userSettings.profile = this.userSettings.profile || this.defaultProfile
  //     this.userSettings.profile.detail[this.type] = this.currentProfile.id
  //   } else {
  //     console.log('current profile', this.currentProfile)
  //     console.log('profiles', profiles)
  //   }
  // }

  // getColumns() {
  //   console.log('getColumns')
  //   const columns$ = this.type === 'taxlots' ? this._columnService.taxLotColumns$ : this._columnService.propertyColumns$
  //   return columns$
  // }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.view) {
      this.getHistory().subscribe()
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api
    this.gridApi.sizeColumnsToFit()
  }

  get gridHeight() {
    if (!this.rowData) return
    return Math.min(this.rowData.length * 70, 500)
  }

  setColumns(columns: Column[]) {
    // why remove lot number? old seed does...
    // columns = columns.filter((c) => c.column_name !== 'lot_number')
    if (this.currentProfile) {
      // format based on profile settings
    } else {
      this.gridColumns = columns.filter((c) => !c.is_extra_data)
    }
    this.derivedColumnNames = new Set(this.gridColumns.filter((c) => c.derived_column).map((c) => c.column_name))
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
    const columnsSorted = this.gridColumns.sort((a, b) => naturalSort(a.display_name, b.display_name))

    for (const { column_name, display_name } of columnsSorted) {
      const row = { field: display_name, state: this.view.state[column_name] }
      for (const item of this.view.history) {
        row[item.filename] = item.state[column_name]
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
    console.log('updateOrgUserSettings')
    return this._organizationService.updateOrganizationUser(this.orgUserId, this.orgId, this.userSettings).pipe(
      map((response) => response.data),
      tap(({ settings }) => {
        console.log('set settings', settings)
        this.userSettings = settings
      }),
    )
  }

  ngOnDestroy(): void {
    console.log('destroy history')
  }
}
