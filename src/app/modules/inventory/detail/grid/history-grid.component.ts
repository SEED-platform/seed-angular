import { CommonModule } from '@angular/common'
import type { OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core'
import { Component, inject, Input } from '@angular/core'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { switchMap, take, tap } from 'rxjs'
import { type Column, ColumnService } from '@seed/api/column'
import { ConfigService } from '@seed/services'
import type { Profile, ValueGetterParamsData, ViewResponse } from '../../inventory.types'
import { MatIconModule } from '@angular/material/icon'
import { MatDividerModule } from '@angular/material/divider'
import { naturalSort } from '@seed/utils'
import { MatButtonModule } from '@angular/material/button'
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
    MatDividerModule
  ],
})
export class HistoryGridComponent implements OnChanges, OnDestroy, OnInit {
  @Input() view: ViewResponse
  @Input() orgId: number
  private _columnService = inject(ColumnService)
  private _configService = inject(ConfigService)
  private _dialog = inject(MatDialog)
  columns: Column[]
  columnDefs: ColDef[]
  currentProfile: Profile
  derivedColumnNames: Set<string>
  gridApi: GridApi
  gridTheme$ = this._configService.gridTheme$
  rowData: Record<string, unknown>[]

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
    return this._columnService.propertyColumns$.pipe(
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
        cellRenderer: ({value}) => {
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
      }
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
    const dialogRef = this._dialog.open(EditStateModalComponent, {
      autoFocus: false,
      disableClose: true,
      width: '50rem',
      maxHeight: '75vh',
      data: { columns: this.columns, orgId: this.orgId, view: this.view },
      panelClass: 'seed-dialog-panel',
    })

    dialogRef.afterClosed().pipe(
      switchMap(() => {
        console.log('refetch')
        return this.getHistory()
      })
    ).subscribe()
  }

  ngOnDestroy(): void {
    console.log('destroy history')
  }
}
