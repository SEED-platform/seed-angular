import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatSelectModule } from '@angular/material/select'
import { MatSidenavModule } from '@angular/material/sidenav'
import { ActivatedRoute } from '@angular/router'
import { AgGridAngular } from 'ag-grid-angular'
import type { CellValueChangedEvent, ColDef, GridApi, GridReadyEvent, RowNode } from 'ag-grid-community'
import { catchError, filter, forkJoin, of, Subject, switchMap, take, tap } from 'rxjs'
import { type Column, ColumnService } from '@seed/api/column'
import type { Cycle } from '@seed/api/cycle'
import { CycleService } from '@seed/api/cycle/cycle.service'
import type { ImportFile } from '@seed/api/dataset'
import { DatasetService } from '@seed/api/dataset'
import { InventoryService } from '@seed/api/inventory'
import type { MappingSuggestionsResponse } from '@seed/api/mapping'
import { MappingService } from '@seed/api/mapping'
import { UserService } from '@seed/api/user'
import { PageComponent } from '@seed/components'
import { ConfigService } from '@seed/services'
import type { InventoryDisplayType, Profile } from 'app/modules/inventory'
import { HelpComponent } from './help.component'
import { buildColumnDefs, gridOptions } from './column-defs'
import { dataTypeMap } from './constants'

@Component({
  selector: 'seed-data-mapping',
  templateUrl: './data-mapping.component.html',
  imports: [
    AgGridAngular,
    CommonModule,
    HelpComponent,
    MatButtonModule,
    MatButtonToggleModule,
    MatDividerModule,
    MatIconModule,
    MatSidenavModule,
    MatSelectModule,
    PageComponent,
    ReactiveFormsModule,
    FormsModule,
  ],
})
export class DataMappingComponent implements OnDestroy, OnInit {
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _configService = inject(ConfigService)
  private _cycleService = inject(CycleService)
  private _columnService = inject(ColumnService)
  private _datasetService = inject(DatasetService)
  private _inventoryService = inject(InventoryService)
  private _mappingService = inject(MappingService)
  private _router = inject(ActivatedRoute)
  private _userService = inject(UserService)
  columns: Column[]
  columnNames: string[]
  columnMap: Record<string, Column>
  columnDefs: ColDef[]
  currentProfile: Profile
  cycle: Cycle
  defaultInventoryType: InventoryDisplayType = 'Property'
  defaultRow: Record<string, unknown>
  fileId = this._router.snapshot.params.id as number
  firstFiveRows: Record<string, unknown>[]
  helpOpened = false
  importFile: ImportFile
  gridApi: GridApi
  gridOptions = gridOptions
  gridTheme$ = this._configService.gridTheme$
  mappingSuggestions: MappingSuggestionsResponse
  orgId: number
  rawColumnNames: string[] = []
  rowData: Record<string, unknown>[] = []

  ngOnInit(): void {
    this._userService.currentOrganizationId$
      .pipe(
        take(1),
        tap((orgId) => this.orgId = orgId),
        switchMap(() => this.getImportFile()),
        filter(Boolean),
        switchMap(() => this.getMappingData()),
        tap(() => { this.setGrid() }),
      )
      .subscribe()
  }

  getImportFile() {
    return this._datasetService.getImportFile(this.orgId, this.fileId)
      .pipe(
        take(1),
        tap((importFile) => { this.importFile = importFile }),
        catchError(() => {
          return of(null)
        }),
      )
  }
  getMappingData() {
    return forkJoin([
      this._cycleService.getCycle(this.orgId, this.importFile.cycle),
      this._mappingService.firstFiveRows(this.orgId, this.fileId),
      this._mappingService.mappingSuggestions(this.orgId, this.fileId),
      this._mappingService.rawColumnNames(this.orgId, this.fileId),
    ])
      .pipe(
        take(1),
        tap(([cycle, firstFiveRows, mappingSuggestions, rawColumnNames]) => {
          this.cycle = cycle
          this.firstFiveRows = firstFiveRows
          this.mappingSuggestions = mappingSuggestions
          this.rawColumnNames = rawColumnNames
          this.setColumns()
        }),
      )
  }

  setGrid() {
    this.defaultRow = {
      isExtraData: false,
      omit: null,
      seed_header: null,
      inventory_type: this.defaultInventoryType,
      dataType: null,
      units: null,
    }
    this.setColumnDefs()
    this.setRowData()
  }

  setColumnDefs() {
    this.columnDefs = buildColumnDefs(
      this.columnNames,
      this.importFile.uploaded_filename,
      this.seedHeaderChange.bind(this),
      this.dataTypeChange.bind(this),
    )
  }

  setRowData() {
    this.rowData = []

    // transpose first 5 rows to fit into the grid
    for (const header of this.rawColumnNames) {
      const keys = ['row1', 'row2', 'row3', 'row4', 'row5']
      const values = this.firstFiveRows.map((r) => r[header])
      const rows: Record<string, unknown> = Object.fromEntries(keys.map((k, i) => [k, values[i]]))

      const data = { ...rows, ...this.defaultRow, file_header: header }
      this.rowData.push(data)
    }

    for (const row of this.rowData) {
      row.omit = false
    }
  }

  onGridReady(agGrid: GridReadyEvent) {
    this.gridApi = agGrid.api
    // this.gridApi.addEventListener('cellClicked', this.onCellClicked.bind(this) as (event: CellClickedEvent) => void)
  }

  setAllInventoryType(value: InventoryDisplayType) {
    this.defaultInventoryType = value
    this.gridApi.forEachNode((n) => n.setDataValue('inventory_type', value))
    this.setColumns()
  }

  setColumns() {
    this.columns = this.defaultInventoryType === 'Tax Lot' ? this.mappingSuggestions?.taxlot_columns : this.mappingSuggestions?.property_columns
    this.columnNames = this.columns.map((c) => c.display_name)
    this.columnMap = this.columns.reduce((acc, curr) => ({ ...acc, [curr.display_name]: curr }), {})
  }

  seedHeaderChange = (params: CellValueChangedEvent): void => {
    const node = params.node as RowNode
    const newValue = params.newValue as string
    const column = this.columnMap[newValue] ?? null

    const dataTypeConfig = dataTypeMap[column?.data_type] ?? { display: 'None', units: null }

    node.setData({
      ...node.data,
      isNewColumn: !column,
      isExtraData: column?.is_extra_data ?? true,
      dataType: dataTypeConfig.display,
      units: dataTypeConfig.units,
    })

    this.refreshNode(node)
  }

  dataTypeChange = (params: CellValueChangedEvent): void => {
    const node = params.node as RowNode
    node.setDataValue('units', null)
    this.refreshNode(node)
  }

  refreshNode(node: RowNode) {
    this.gridApi.refreshCells({
      rowNodes: [node],
      force: true,
    })
  }

  copyHeadersToSeed() {
    const { property_columns, taxlot_columns, suggested_column_mappings } = this.mappingSuggestions
    const columns = this.defaultInventoryType === 'Tax Lot' ? taxlot_columns : property_columns
    const columnMap: Record<string, string> = columns.reduce((acc, { column_name, display_name }) => ({ ...acc, [column_name]: display_name }), {})

    this.gridApi.forEachNode((node: RowNode<{ file_header: string }>) => {
      const fileHeader = node.data.file_header
      const suggestedColumnName = suggested_column_mappings[fileHeader][1]
      const displayName = columnMap[suggestedColumnName]
      node.setDataValue('seed_header', displayName)
    })
  }

  toggleHelp = () => {
    this.helpOpened = !this.helpOpened
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
