import { CommonModule } from '@angular/common'
import type { OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core'
import { Component, inject, Input } from '@angular/core'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { take, tap } from 'rxjs'
import { type Column, ColumnService } from '@seed/api/column'
import { ConfigService } from '@seed/services'
import type { Profile, ValueGetterParamsData, ViewResponse } from '../inventory.types'
import { MatIconModule } from '@angular/material/icon'
import { MatDividerModule } from '@angular/material/divider'
import { naturalSort } from '@seed/utils'
import { MatButtonModule } from '@angular/material/button'


ModuleRegistry.registerModules([AllCommunityModule])

@Component({
  selector: 'seed-inventory-detail-history',
  templateUrl: './history-grid.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
})
export class HistoryGridComponent implements OnChanges, OnDestroy, OnInit {
  @Input() view: ViewResponse
  private _columnService = inject(ColumnService)
  private _configService = inject(ConfigService)
  columns: Column[]
  columnDefs: ColDef[]
  currentProfile: Profile
  gridApi: GridApi
  gridTheme$ = this._configService.gridTheme$
  isEditing = false
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
  }

  setColumnDefs() {
    this.columnDefs = [
      { field: 'field', headerName: 'Field', pinned: true },
      { 
        field: 'state', 
        headerName: 'Main', 
        editable: () => this.isEditing,
        cellStyle: () => this.isEditing ? {
          border: '1px solid #ccc',
          'border-radius': '4px',
          cursor: 'text',
        } : { 
          border: 'none',
          cursor: 'default',
        },
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

  edit() {
    this.isEditing = true
    this.gridApi.refreshCells({ force: true, columns: ['state'] });
  }

  save() {
    console.log('save')
    this.isEditing = false
    this.gridApi.refreshCells({ force: true, columns: ['state'] });
  }

  cancel() {
    console.log('cancel')
    this.isEditing = false
    this.gridApi.refreshCells({ force: true, columns: ['state'] });
  }

  ngOnDestroy(): void {
    console.log('destroy history')
  }
}
