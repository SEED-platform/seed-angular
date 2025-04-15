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
import { finalize, take, tap } from 'rxjs'
import { type Column, ColumnService } from '@seed/api/column'
import { InventoryService } from '@seed/api/inventory'
import { ConfigService } from '@seed/services'
import { naturalSort } from '@seed/utils'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import type { InventoryType, Profile, State, ValueGetterParamsData, ViewResponse } from '../../inventory.types'
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
export class HistoryGridComponent implements OnChanges, OnDestroy, OnInit {
  @Input() matchingColumns: string[]
  @Input() orgId: number
  @Input() type: InventoryType
  @Input() view: ViewResponse
  @Input() viewId: number
  private _columnService = inject(ColumnService)
  private _configService = inject(ConfigService)
  private _dialog = inject(MatDialog)
  private _inventoryService = inject(InventoryService)
  private _router = inject(Router)
  private _snackBar = inject(SnackBarService)
  columns: Column[]
  columnDefs: ColDef[]
  currentProfile: Profile
  derivedColumnNames: Set<string>
  gridApi: GridApi
  gridTheme$ = this._configService.gridTheme$
  loading = false
  rowData: Record<string, unknown>[]
  viewCopy: ViewResponse

  defaultColDef = {
    sortable: false,
    filter: false,
    resizable: true,
    suppressMovable: true,
  }

  ngOnInit(): void {
    this.getHistory().subscribe()
  }

  getHistory() {
    const columns$ = this.type === 'taxlots' ? this._columnService.taxLotColumns$ : this._columnService.propertyColumns$
    return columns$.pipe(
      take(1),
      tap((columns) => {
        this.setColumns(columns)
        this.setColumnDefs()
        this.setRowData()
      }),
    )
  }

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
      this.columns = columns.filter((c) => !c.is_extra_data)
    }
    this.derivedColumnNames = new Set(this.columns.filter((c) => c.derived_column).map((c) => c.column_name))
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
    const columnsSorted = this.columns.sort((a, b) => naturalSort(a.display_name, b.display_name))

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
      data: { columns: this.columns, orgId: this.orgId, view: this.view, matchingColumns: this.matchingColumns },
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

  ngOnDestroy(): void {
    console.log('destroy history')
  }
}
