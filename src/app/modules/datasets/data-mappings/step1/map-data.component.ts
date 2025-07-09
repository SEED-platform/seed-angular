/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { CommonModule } from '@angular/common'
import type { OnChanges, OnDestroy, SimpleChanges } from '@angular/core'
import { Component, EventEmitter, inject, Input, Output } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MatOptionModule } from '@angular/material/core'
import { MatDialog } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatSelectModule } from '@angular/material/select'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatStepperModule } from '@angular/material/stepper'
import { MatTooltipModule } from '@angular/material/tooltip'
import { ActivatedRoute } from '@angular/router'
import { AgGridAngular } from 'ag-grid-angular'
import type { CellValueChangedEvent, ColDef, GridApi, GridReadyEvent, RowNode } from 'ag-grid-community'
import { Subject, switchMap, take } from 'rxjs'
import { type Column } from '@seed/api/column'
import type { ColumnMappingProfileType } from '@seed/api/column_mapping_profile'
import { type ColumnMapping, type ColumnMappingProfile, ColumnMappingProfileService } from '@seed/api/column_mapping_profile'
import type { Cycle } from '@seed/api/cycle'
import type { DataMappingRow, ImportFile } from '@seed/api/dataset'
import type { MappingSuggestionsResponse } from '@seed/api/mapping'
import { AlertComponent, PageComponent } from '@seed/components'
import { ConfigService } from '@seed/services'
import type { ProgressBarObj } from '@seed/services/uploader'
import type { InventoryDisplayType } from 'app/modules/inventory'
import { HelpComponent } from '../help.component'
import { buildColumnDefs, gridOptions } from './column-defs'
import { dataTypeMap, displayToDataTypeMap } from './constants'
import { CreateProfileComponent } from './modal/create-profile.component'

@Component({
  selector: 'seed-map-data',
  templateUrl: './map-data.component.html',
  imports: [
    AgGridAngular,
    AlertComponent,
    CommonModule,
    HelpComponent,
    MatButtonModule,
    MatButtonToggleModule,
    MatDividerModule,
    MatIconModule,
    MatOptionModule,
    MatSidenavModule,
    MatSelectModule,
    MatStepperModule,
    MatTooltipModule,
    PageComponent,
    ReactiveFormsModule,
    FormsModule,
  ],
})
export class MapDataComponent implements OnChanges, OnDestroy {
  @Input() orgId: number
  @Input() importFile: ImportFile
  @Input() columnMappingProfiles: ColumnMappingProfile[]
  @Input() cycle: Cycle
  @Input() firstFiveRows: Record<string, unknown>[]
  @Input() mappingSuggestions: MappingSuggestionsResponse
  @Input() rawColumnNames: string[]
  @Input() matchingPropertyColumns: string[]
  @Input() matchingTaxLotColumns: string[]
  @Output() completed = new EventEmitter<null>()

  private readonly _unsubscribeAll$ = new Subject<void>()
  private _configService = inject(ConfigService)
  private _columnMappingProfileService = inject(ColumnMappingProfileService)
  private _dialog = inject(MatDialog)
  private _router = inject(ActivatedRoute)
  profile: ColumnMappingProfile
  columns: Column[]
  columnNames: string[]
  columnMap: Record<string, Column>
  columnDefs: ColDef[]
  dataValid = false
  defaultInventoryType: InventoryDisplayType = 'Property'
  defaultRow: Record<string, unknown>
  errorMessages: string[] = []
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
      to_field: null,
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

  applyProfile() {
    const toTableMap = { TaxLotState: 'Tax Lot', PropertyState: 'Property' }
    const mappingsMap = Object.fromEntries(this.profile.mappings.map((m) => [m.from_field, m]))
    const columnNameMap = Object.fromEntries(this.columns.map((c) => [c.column_name, c.display_name]))
    this.gridApi.forEachNode((node: RowNode<{ from_field: string }>) => {
      const mapping = mappingsMap[node.data.from_field]
      if (!mapping) return // skip if no mapping found

      const displayField = columnNameMap[mapping.to_field] ?? mapping.to_field
      node.setDataValue('to_field_display_name', displayField)
      node.setDataValue('to_field', mapping.to_field)
      node.setDataValue('from_units', mapping.from_units)
      node.setDataValue('to_table_name', toTableMap[mapping.to_table_name])
    })
  }

  saveProfile() {
    // overwrite the existing profile
    const mappings: ColumnMapping[] = []
    this.gridApi.forEachNode((node) => {
      const mapping = this.formatRowToMapping(node.data)
      if (mapping) mappings.push(mapping)
    })
    this.profile.mappings = mappings
    this._columnMappingProfileService.update(this.orgId, this.profile).subscribe()
  }

  formatRowToMapping(row: Record<string, unknown>): ColumnMapping {
    if (!row.to_field) return null
    const to_table_name = row.to_table_name === 'Tax Lot' ? 'TaxLotState' : 'PropertyState'
    const mapping: ColumnMapping = {
      from_field: row.from_field as string,
      from_units: row.from_units as string,
      to_field: row.to_field as string,
      to_table_name,
    }
    if (row.omit) mapping.is_omitted = true
    return mapping
  }

  createProfile() {
    console.log('create profile')
    const profileType: ColumnMappingProfileType = this.importFile.source_type === 'BuildingSync' ? 'BuildingSync Custom' : 'Normal'
    const profileTypes: ColumnMappingProfileType[] = profileType === 'BuildingSync Custom' ? ['BuildingSync Default', 'BuildingSync Custom'] : ['Normal']
    const dialogRef = this._dialog.open(CreateProfileComponent, {
      width: '40rem',
      data: {
        existingNames: this.columnMappingProfiles.map((p) => p.name),
        orgId: this.orgId,
        profileType,
      },
    })

    dialogRef
      .afterClosed()
      .pipe(
        take(1),
        switchMap(() => this._columnMappingProfileService.getProfiles(this.orgId, profileTypes)),
      )
      .subscribe()
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
    this.errorMessages = []
    const matchingColumns = this.defaultInventoryType === 'Tax Lot' ? this.matchingTaxLotColumns : this.matchingPropertyColumns
    let toFields = []
    this.gridApi.forEachNode((node: RowNode<DataMappingRow>) => {
      if (node.data.omit) return // skip omitted rows
      toFields.push(node.data.to_field)
    })

    // at least one matching column
    const hasMatchingCol = toFields.some((col) => matchingColumns.includes(col))
    if (!hasMatchingCol) {
      const matchingColNames = this.columns.filter((c) => c.is_matching_criteria).map((c) => c.display_name).join(', ')
      this.errorMessages.push(`At least one of the following Property fields is required: ${matchingColNames}.`)
    }

    // all fields must be mapped (no empty fields)
    if (!toFields.every((f) => f)) {
      this.dataValid = false
      this.errorMessages.push('All SEED Headers must be mapped. Empty values are not allowed.')
    }

    // no duplicates
    toFields = toFields.filter((f) => f)
    if (toFields.length !== new Set(toFields).size) {
      this.dataValid = false
      this.errorMessages.push('Duplicate headers found. Each SEED Header must be unique.')
    }

    this.dataValid = this.errorMessages.length === 0
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
