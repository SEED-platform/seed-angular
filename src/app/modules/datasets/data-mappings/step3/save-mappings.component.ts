import { CommonModule } from '@angular/common'
import type { OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import type { Column } from '@seed/api/column'
import type { Cycle } from '@seed/api/cycle'
import { DataQualityService } from '@seed/api/data-quality'
import type { ImportFile, MappingResultsResponse } from '@seed/api/dataset'
import type { Organization } from '@seed/api/organization'
import { ConfigService } from '@seed/services'
import { UploaderService } from '@seed/services/uploader'
import { AgGridAngular } from 'ag-grid-angular'
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import type { InventoryType } from 'app/modules/inventory'
import { Subject, switchMap, take } from 'rxjs'

@Component({
  selector: 'seed-save-mappings',
  templateUrl: './save-mappings.component.html',
  imports: [
    AgGridAngular,
    CommonModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatProgressBarModule,
  ],
})
export class SaveMappingsComponent implements OnChanges, OnDestroy {
  @Input() columns: Column[]
  @Input() cycle: Cycle
  @Input() importFile: ImportFile
  @Input() mappingResultsResponse: MappingResultsResponse
  @Input() org: Organization
  @Input() orgId: number
  @Output() completed = new EventEmitter<null>()
  @Output() inventoryTypeChange = new EventEmitter<InventoryType>()

  private _configService = inject(ConfigService)
  private _dataQualityService = inject(DataQualityService)
  private _uploaderService = inject(UploaderService)
  private _unsubscribeAll$ = new Subject<void>()
  columnDefs: ColDef[] = []
  rowData: Record<string, unknown>[] = []
  gridApi: GridApi
  gridTheme$ = this._configService.gridTheme$
  mappingResults: Record<string, unknown>[] = []
  dqcComplete = false
  inventoryType: InventoryType

  progressBarObj = this._uploaderService.defaultProgressBarObj

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.mappingResultsResponse?.currentValue) return

    const { properties, tax_lots } = this.mappingResultsResponse
    if (tax_lots.length) {
      this.mappingResults = tax_lots
      this.inventoryTypeChange.emit('taxlots')
    } else {
      this.mappingResults = properties
      this.inventoryTypeChange.emit('properties')
    }

    this.startDQC()
    this.setGrid()
  }

  startDQC() {
    const successFn = () => {
      this.dqcComplete = true
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const failureFn = () => {}

    this._dataQualityService.startDataQualityCheckForImportFile(this.orgId, this.importFile.id)
      .pipe(
        take(1),
        switchMap(({ progress_key }) => {
          return this._uploaderService.checkProgressLoop({
            progressKey: progress_key,
            offset: 0,
            multiplier: 1,
            successFn,
            failureFn,
            progressBarObj: this.progressBarObj,
          })
        }),
      )
      .subscribe()
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
    // console.log(this.mappingResults)
    this.completed.emit()
  }

  showDataQualityResults() {
    console.log('open modal showing dqc results')
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
