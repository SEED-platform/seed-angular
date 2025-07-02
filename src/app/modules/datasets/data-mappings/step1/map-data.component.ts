/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { CommonModule } from '@angular/common'
import type { OnChanges, OnDestroy, SimpleChanges } from '@angular/core'
import { Component, EventEmitter, inject, Input, Output } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatSelectModule } from '@angular/material/select'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatStepperModule } from '@angular/material/stepper'
import { ActivatedRoute } from '@angular/router'
import { type Column } from '@seed/api/column'
import type { Cycle } from '@seed/api/cycle'
import type { DataMappingRow, ImportFile } from '@seed/api/dataset'
import type { MappingSuggestionsResponse } from '@seed/api/mapping'
import { PageComponent } from '@seed/components'
import { ConfigService } from '@seed/services'
import type { ProgressBarObj } from '@seed/services/uploader'
import { AgGridAngular } from 'ag-grid-angular'
import type { CellValueChangedEvent, ColDef, GridApi, GridReadyEvent, RowNode } from 'ag-grid-community'
import type { InventoryDisplayType, Profile } from 'app/modules/inventory'
import { Subject } from 'rxjs'
import { HelpComponent } from '../help.component'
import { buildColumnDefs, gridOptions } from './column-defs'
import { dataTypeMap, displayToDataTypeMap } from './constants'

@Component({
  selector: 'seed-map-data',
  templateUrl: './map-data.component.html',
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
    MatStepperModule,
    PageComponent,
    ReactiveFormsModule,
    FormsModule,
  ],
})
export class MapDataComponent implements OnChanges, OnDestroy {
  @Input() orgId: number
  @Input() importFile: ImportFile
  @Input() cycle: Cycle
  @Input() firstFiveRows: Record<string, unknown>[]
  @Input() mappingSuggestions: MappingSuggestionsResponse
  @Input() rawColumnNames: string[]
  @Input() matchingPropertyColumns: string[]
  @Input() matchingTaxLotColumns: string[]
  @Output() completed = new EventEmitter<null>()

  private readonly _unsubscribeAll$ = new Subject<void>()
  private _configService = inject(ConfigService)
  private _router = inject(ActivatedRoute)
  columns: Column[]
  columnNames: string[]
  columnMap: Record<string, Column>
  columnDefs: ColDef[]
  currentProfile: Profile
  dataValid = false
  defaultInventoryType: InventoryDisplayType = 'Property'
  defaultRow: Record<string, unknown>
  fileId = this._router.snapshot.params.id as number
  gridApi: GridApi
  gridOptions = gridOptions
  gridTheme$ = this._configService.gridTheme$
  mappedData: { mappings: DataMappingRow[] } = { mappings: [] }
  rowData: Record<string, unknown>[] = []

  progressBarObj: ProgressBarObj = {
    message: [],
    progress: 0,
    total: 100,
    complete: false,
    statusMessage: '',
    progressLastUpdated: null,
    progressLastChecked: null,
  }

  ngOnChanges(changes: SimpleChanges): void {
    // property columns is the last value to be set
    if ((changes.matchingPropertyColumns?.currentValue as string[])?.length) {
      this.setColumns()
      this.setGrid()
    }
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
  }

  setAllInventoryType(value: InventoryDisplayType) {
    this.defaultInventoryType = value
    this.gridApi.forEachNode((node) => node.setDataValue('to_table_display_name', value))
    this.setColumns()
  }

  setColumns() {
    this.columns = this.defaultInventoryType === 'Tax Lot' ? this.mappingSuggestions?.taxlot_columns : this.mappingSuggestions?.property_columns
    this.columnNames = this.columns.map((c) => c.display_name)
    this.columnMap = Object.fromEntries(this.columns.map((c) => [c.display_name, c]))
  }

  seedHeaderChange = (params: CellValueChangedEvent): void => {
    const node = params.node as RowNode
    const newValue = params.newValue as string
    const column = this.columnMap[newValue] ?? null

    const dataTypeConfig = dataTypeMap[column?.data_type] ?? { display: 'None', units: null }
    const to_field = column?.column_name ?? newValue
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
    if (!this.dataValid) return

    this.gridApi.forEachNode(({ data }: { data: DataMappingRow }) => {
      if (data.omit) return // skip omitted rows

      const { from_field, from_units, to_data_type, to_field, to_field_display_name, to_table_name } = data

      this.mappedData.mappings.push({
        from_field,
        from_units: from_units?.replace('²', '**2') ?? null,
        to_data_type: displayToDataTypeMap[to_data_type] ?? null,
        to_field,
        to_field_display_name,
        to_table_name: to_table_name === 'Tax Lot' ? 'TaxLotState' : 'PropertyState',
      })
    })
    this.completed.emit()
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

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
