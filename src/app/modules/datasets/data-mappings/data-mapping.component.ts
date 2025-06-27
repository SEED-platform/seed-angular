import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatSidenavModule } from '@angular/material/sidenav'
import { ActivatedRoute } from '@angular/router'
import { AgGridAngular } from 'ag-grid-angular'
import type { ColDef, ColGroupDef, GridApi, GridReadyEvent, RowNode } from 'ag-grid-community'
import { catchError, filter, forkJoin, of, Subject, switchMap, take, tap } from 'rxjs'
import type { ImportFile } from '@seed/api/dataset'
import { DatasetService } from '@seed/api/dataset'
import type { MappingSuggestionsResponse } from '@seed/api/mapping'
import { MappingService } from '@seed/api/mapping'
import { UserService } from '@seed/api/user'
import { PageComponent } from '@seed/components'
import { ConfigService } from '@seed/services'
import { HelpComponent } from './help.component'
import { Column } from '@seed/api/column'
import { Cycle } from '@seed/api/cycle'
import { CycleService } from '@seed/api/cycle/cycle.service'
import { InventoryDisplayType, Profile } from 'app/modules/inventory'
import { InventoryService } from '@seed/api/inventory'
import { MatDividerModule } from '@angular/material/divider'
import { MatSelectModule } from '@angular/material/select'


@Component({
  selector: 'seed-data-mapping',
  templateUrl: './data-mapping.component.html',
  imports: [
    AgGridAngular,
    CommonModule,
    HelpComponent,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatSidenavModule,
    MatSelectModule,
    PageComponent,
  ],
})
export class DataMappingComponent implements OnDestroy, OnInit {
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _configService = inject(ConfigService)
  private _cycleService = inject(CycleService)
  private _datasetService = inject(DatasetService)
  private _inventoryService = inject(InventoryService)
  private _mappingService = inject(MappingService)
  private _router = inject(ActivatedRoute)
  private _userService = inject(UserService)
  columns: Column[]
  columnDefs: ColDef[]
  currentProfile: Profile
  cycle: Cycle
  defaultInventoryType = 'Property'
  fileId = this._router.snapshot.params.id as number
  firstFiveRows: Record<string, unknown>[]
  helpOpened = false
  importFile: ImportFile
  gridApi: GridApi
  gridOptions = {
    singleClickEdit: true,
    suppressMovableColumns: true,
  }
  gridTheme$ = this._configService.gridTheme$
  mappingSuggestions: MappingSuggestionsResponse
  orgId: number
  rawColumnNames: string[] = []
  rowData: Record<string, unknown>[] = []

  ngOnInit(): void {
    console.log('Data Mapping Component Initialized')
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
        }),
      )
  }

  setGrid() {
    this.setColumnDefs()
    this.setRowData()
  }

  setColumnDefs() {
    const seedCols: ColDef[] = [
      {
        field: 'omit',
        headerName: 'Omit',
        editable: true,
        cellEditor: 'agCheckboxCellEditor',
      },
      {
        field: 'inventory_type',
        headerName: 'Inventory Type',
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: ['Property', 'Tax Lot'],
        },
        cellRenderer: this.dropdownRenderer,
      },
      {
        field: 'seed_header',
        headerName: 'SEED Header',
        editable: true,
        cellRenderer: this.inputRenderer,
        cellEditor: 'agTextCellEditor',
      },
    ]

    const fileCols: ColDef[] = [
      { field: 'data_type', headerName: 'Data Type' },
      { field: 'units', headerName: 'Units' },
      { field: 'file_header', headerName: 'Data File Header' },
      { field: 'row1', headerName: 'Row 1' },
      { field: 'row2', headerName: 'Row 2' },
      { field: 'row3', headerName: 'Row 3' },
      { field: 'row4', headerName: 'Row 4' },
      { field: 'row5', headerName: 'Row 5' },
    ]

    this.columnDefs = [
      { headerName: 'SEED', children: seedCols } as ColGroupDef,
      { headerName: this.importFile.uploaded_filename, children: fileCols } as ColGroupDef,
    ]
  }

  dropdownRenderer({ value }: { value: string }) {
    return `
      <div class="flex justify-between -ml-3 w-[115%] h-full border rounded">
        <span class="px-2">${value ?? ''}</span>
        <span class="material-icons cursor-pointer text-secondary">arrow_drop_down</span>
      </div>
    `
  }

  inputRenderer({ value }: { value: string }) {
    return `
      <div class="-ml-3 px-2 w-[115%] h-full border rounded">
        ${value ?? ''}
      </div>
    `
  }

  setRowData() {
    this.rowData = []

    // transpose first 5 rows to fit into the grid
    for (const header of this.rawColumnNames) {
      const keys = ['file_header', 'row1', 'row2', 'row3', 'row4', 'row5']
      const values = this.firstFiveRows.map((r) => r[header])
      values.unshift(header)

      const data = Object.fromEntries(keys.map((k, i) => [k, values[i]]))
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
  }

  copyHeadersToSeed() {
    const { property_columns, taxlot_columns, suggested_column_mappings } = this.mappingSuggestions
    const columns = this.defaultInventoryType === 'Tax Lot' ? taxlot_columns : property_columns
    const columnMap: Record<string, string> = columns.reduce((acc, { column_name, display_name }) => ({ ...acc, [column_name]: display_name }), {})

    this.gridApi.forEachNode((n: RowNode<{ file_header: string }>) => {
      const fileHeader = n.data.file_header
      const suggestedColumnName = suggested_column_mappings[fileHeader][1]
      const displayName = columnMap[suggestedColumnName]
      n.setDataValue('seed_header', displayName)
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
