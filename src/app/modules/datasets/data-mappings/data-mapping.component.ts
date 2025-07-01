/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
import type { DataMappingRow, ImportFile } from '@seed/api/dataset'
import { DatasetService } from '@seed/api/dataset'
import { InventoryService } from '@seed/api/inventory'
import type { MappingSuggestionsResponse } from '@seed/api/mapping'
import { MappingService } from '@seed/api/mapping'
import { OrganizationService } from '@seed/api/organization'
import { UserService } from '@seed/api/user'
import { PageComponent } from '@seed/components'
import { ConfigService } from '@seed/services'
import type { InventoryDisplayType, Profile } from 'app/modules/inventory'
import { buildColumnDefs, gridOptions } from './column-defs'
import { dataTypeMap, displayToDataTypeMap } from './constants'
import { HelpComponent } from './help.component'

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
  private _organizationService = inject(OrganizationService)
  private _router = inject(ActivatedRoute)
  private _userService = inject(UserService)
  columns: Column[]
  columnNames: string[]
  columnMap: Record<string, Column>
  columnDefs: ColDef[]
  currentProfile: Profile
  cycle: Cycle
  dataValid = false
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
  matchingPropertyColumns: string[] = []
  matchingTaxLotColumns: string[] = []
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
        switchMap(() => this.getMatchingColumns()),
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

  getMatchingColumns() {
    return forkJoin([
      this._organizationService.getMatchingCriteriaColumns(this.orgId, 'properties'),
      this._organizationService.getMatchingCriteriaColumns(this.orgId, 'taxlots'),
    ])
      .pipe(
        take(1),
        tap(([matchingPropertyColumns, matchingTaxLotColumns]) => {
          this.matchingPropertyColumns = matchingPropertyColumns as string[]
          this.matchingTaxLotColumns = matchingTaxLotColumns as string[]
        }),
      )

  }

  setGrid() {
    this.defaultRow = {
      isExtraData: false,
      omit: null,
      to_field_display_name: null,
      to_table_name: this.defaultInventoryType,
      to_data_type: null,
      from_units: null,
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

      const data = { ...rows, ...this.defaultRow, from_field: header }
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
    this.gridApi.forEachNode((node) => node.setDataValue('to_table_display_name', value))
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
    const to_field = column?.column_name ?? newValue
    console.log('set dataType', dataTypeConfig.display)
    node.setData({
      ...node.data,
      isNewColumn: !column,
      isExtraData: column?.is_extra_data ?? true,
      to_data_type: dataTypeConfig.display,
      to_field,
      from_units: dataTypeConfig.units,
    })

    this.refreshNode(node)
    this.validateData()
  }

  dataTypeChange = (params: CellValueChangedEvent): void => {
    const node = params.node as RowNode
    node.setDataValue('from_units', null)
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

    this.gridApi.forEachNode((node: RowNode<{ from_field: string }>) => {
      const fileHeader = node.data.from_field
      const suggestedColumnName = suggested_column_mappings[fileHeader][1]
      const displayName = columnMap[suggestedColumnName]
      node.setDataValue('to_field_display_name', displayName)
    })
  }

  // Format data for backend consumption
  mapData() {
    const result = []
    this.gridApi.forEachNode(({ data }: { data: DataMappingRow }) => {
      if (data.omit) return // skip omitted rows

      const { from_field, from_units, to_data_type, to_field, to_field_display_name, to_table_name } = data

      result.push({
        from_field,
        from_units: from_units?.replace('²', '**2') ?? null,
        to_data_type: displayToDataTypeMap[to_data_type] ?? null,
        to_field,
        to_field_display_name,
        to_table_name: to_table_name ?? this.defaultInventoryType,
      })
    })
    console.log('Mapped Data:', result)
  }

  validateData() {
    const matchingColumns = this.defaultInventoryType === 'Tax Lot' ? this.matchingTaxLotColumns : this.matchingPropertyColumns
    const toFields = []
    this.gridApi.forEachNode((node: RowNode<DataMappingRow>) => {
      if (node.data.omit) return // skip omitted rows
      toFields.push(node.data.to_field)
    })

    // no duplicates
    if (toFields.length !== new Set(toFields).size) {
      this.dataValid = false
      return
    }
    // at least one matching column
    const hasMatchingCol = toFields.some((col) => matchingColumns.includes(col))
    if (!hasMatchingCol) {
      this.dataValid = false
      return
    }

    this.dataValid = true
  }

  toggleHelp = () => {
    this.helpOpened = !this.helpOpened
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
