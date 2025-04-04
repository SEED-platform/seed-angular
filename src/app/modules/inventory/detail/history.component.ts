import type { OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core'
import { Component, inject, Input } from '@angular/core'
import { type Column, ColumnService } from '@seed/api/column'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { ColDef, ColGroupDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community'
import { take, tap } from 'rxjs'
import type { Profile, ViewResponse } from '../inventory.types'
import { AllCommunityModule, colorSchemeDarkBlue, colorSchemeLight, ModuleRegistry, themeAlpine } from 'ag-grid-community'


ModuleRegistry.registerModules([AllCommunityModule])

@Component({
  selector: 'seed-inventory-detail-history',
  templateUrl: './history.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
  ],
})
export class HistoryComponent implements OnChanges, OnDestroy, OnInit {
  @Input() view: ViewResponse
  private _columnService = inject(ColumnService)
  columns: Column[]
  columnDefs: ColDef[]
  currentProfile: Profile
  gridTheme = themeAlpine.withPart(colorSchemeLight)
  rowData: Record<string, unknown>[]
  gridApi: GridApi

  ngOnInit(): void {
    console.log('init history')
    this.getHistory().subscribe()
  }

  getHistory() {
    return this._columnService.propertyColumns$.pipe(
      take(1),
      tap((columns) => {
        this.setColumns(columns)
        // this.setColumnDefs()
        // this.setHistoryRowDataTransposed()
        this.setColumnDefs()
        this.setRowData()
      }),
    )
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('changes', changes)
    if (changes.view) {
      this.getHistory()
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api
    console.log('gridApi', this.gridApi)
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

  // setColumnDefsTransposed() {
  //   this.columnDefs = this.columns.map((c) => ({ field: c.column_name, headerName: c.display_name }))
  // }

  setColumnDefs() {
    this.columnDefs = [
      { field: 'field', headerName: 'Field' },
      { field: 'state', headerName: 'Main' },
    ]
    for (const { filename } of this.view.history) {
      this.columnDefs.push({ field: filename, headerName: filename })
    }
  }

  setRowData() {
    // NO - its all addressline 1, all addressline 2, etc
    // 1. field names
    // 2. this state
    // 3. historical states
    // const rows = []
    this.rowData = []
    for (const { column_name, display_name } of this.columns) {
      const row = { field: display_name, state: this.view.state[column_name] }
      for (const item of this.view.history) {
        // WHY ISNT THIS WORKING?
        row[item.filename] = item.state[column_name]
      }
      this.rowData.push(row)
    }
    // const fieldNames = this.columns.map((c) => c.column_name)
    // const state = this.view.state
  }

  setHistoryRowDataTranspose() {
    const historicalStates = this.view.history.map((h) => h.state)
    this.rowData = [this.view.state, ...historicalStates]
    console.log('rowData', this.rowData)
    console.log('columnDefs', this.columnDefs)
  }

  ngOnDestroy(): void {
    console.log('destroy history')
  }
}
