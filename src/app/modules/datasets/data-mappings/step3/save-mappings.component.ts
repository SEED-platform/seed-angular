import { CommonModule } from '@angular/common'
import type { OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDividerModule } from '@angular/material/divider'
import type { Column } from '@seed/api/column'
import type { Cycle } from '@seed/api/cycle'
import type { MappingResultsResponse } from '@seed/api/dataset'
import type { Organization } from '@seed/api/organization'
import { ConfigService } from '@seed/services'
import { AgGridAngular } from 'ag-grid-angular'
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import { Subject } from 'rxjs'

@Component({
  selector: 'seed-save-mappings',
  templateUrl: './save-mappings.component.html',
  imports: [
    AgGridAngular,
    CommonModule,
    MatDividerModule,
    MatButtonModule,
  ],
})
export class SaveMappingsComponent implements OnChanges, OnDestroy {
  @Input() columns: Column[]
  @Input() cycle: Cycle
  @Input() mappingResultsResponse: MappingResultsResponse
  @Input() org: Organization
  @Input() orgId: number
  @Output() completed = new EventEmitter<null>()

  private _configService = inject(ConfigService)
  private _unsubscribeAll$ = new Subject<void>()
  columnDefs: ColDef[] = []
  rowData: Record<string, unknown>[] = []
  gridApi: GridApi
  gridTheme$ = this._configService.gridTheme$
  mappingResults: Record<string, unknown>[] = []

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.mappingResultsResponse?.currentValue) return

    const { properties, tax_lots } = this.mappingResultsResponse
    this.mappingResults = tax_lots.length ? tax_lots : properties || []
    this.setGrid()
  }

  setGrid() {
    this.setColumnDefs()
    this.setRowData()
  }

  setColumnDefs() {
    const aliClass = 'bg-primary bg-opacity-25'

    let keys = Object.keys(this.mappingResults[0] ?? {})
    // remove ALI & hidden cols
    const excludeKeys = ['id', 'lot_number', 'raw_access_level_instance_error', ...this.org.access_level_names]
    keys = keys.filter((k) => !excludeKeys.includes(k))

    const hiddenColumnDefs = [
      { field: 'id', hide: true },
      { field: 'lot_number', hide: true },
    ]

    // ALI columns
    const aliErrorDef = { field: 'raw_access_level_instance_error', headerName: 'Access Level Error', cellClass: aliClass }
    let aliColumnDefs = this.org.access_level_names.map((name) => ({ field: name, cellClass: aliClass }))
    aliColumnDefs = [aliErrorDef, ...aliColumnDefs]

    // Inventory Columns
    const columnNameMap: Record<string, string> = this.columns.reduce((acc, { name, display_name }) => ({ ...acc, [name]: display_name }), {})
    const inventoryColumnDefs = keys.map((key) => ({ field: key, headerName: columnNameMap[key] || key }))

    this.columnDefs = [...hiddenColumnDefs, ...aliColumnDefs, ...inventoryColumnDefs]
  }

  setRowData() {
    this.rowData = this.mappingResults
  }

  onGridReady(agGrid: GridReadyEvent) {
    this.gridApi = agGrid.api
  }

  saveData() {
    console.log('Saving data...')
    console.log(this.mappingResults)
    this.completed.emit()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
