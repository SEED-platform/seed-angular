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

ModuleRegistry.registerModules([AllCommunityModule])

@Component({
  selector: 'seed-inventory-detail-history',
  templateUrl: './history.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    CommonModule,
  ],
})
export class HistoryComponent implements OnChanges, OnDestroy, OnInit {
  @Input() view: ViewResponse
  private _columnService = inject(ColumnService)
  private _configService = inject(ConfigService)
  columns: Column[]
  columnDefs: ColDef[]
  currentProfile: Profile
  gridTheme$ = this._configService.gridTheme$
  rowData: Record<string, unknown>[]
  gridApi: GridApi

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
    this.gridApi.autoSizeAllColumns()
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
      { field: 'state', headerName: 'Main' },
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
    for (const { column_name, display_name } of this.columns) {
      const row = { field: display_name, state: this.view.state[column_name] }
      for (const item of this.view.history) {
        row[item.filename] = item.state[column_name]
      }
      this.rowData.push(row)
    }
  }

  ngOnDestroy(): void {
    console.log('destroy history')
  }
}
