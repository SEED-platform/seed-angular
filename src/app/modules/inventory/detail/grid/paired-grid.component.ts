import { CommonModule } from '@angular/common'
import type { OnChanges, OnDestroy, SimpleChanges } from '@angular/core'
import { Component, inject, Input } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { ColDef, FirstDataRenderedEvent, GridApi, GridReadyEvent } from 'ag-grid-community'
import type { Observable } from 'rxjs'
import { of, Subject, takeUntil, tap } from 'rxjs'
import type { Column } from '@seed/api/column'
import { ColumnService } from '@seed/api/column'
import type { Organization } from '@seed/api/organization'
import { ConfigService } from '@seed/services'
import type { InventoryType, ViewResponse } from '../../inventory.types'

@Component({
  selector: 'seed-inventory-detail-paired-grid',
  templateUrl: './paired-grid.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    CommonModule,
    MatIconModule,
  ],
})
export class PairedGridComponent implements OnChanges, OnDestroy {
  @Input() org: Organization
  @Input() type: InventoryType
  @Input() view: ViewResponse
  private _columnService = inject(ColumnService)
  private _configService = inject(ConfigService)
  private readonly _unsubscribeAll$ = new Subject<void>()

  gridApi: GridApi
  gridTheme$ = this._configService.gridTheme$
  columns: Column[]
  columnDefs: ColDef[] = []
  defaultColumn: Column
  rowData: Record<string, unknown>[] = []
  defaultColDef = {
    sortable: false,
    filter: false,
    resizable: true,
    suppressMovable: true,
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.view) {
      this.getData().subscribe()
    }
  }

  get data() {
    if (!this.view) return []
    return this.type === 'taxlots' ? this.view.properties : this.view.taxlots
  }

  getData(): Observable<Column[]> {
    if (!this.data.length) return of<Column[]>([])

    const stream = this.type === 'taxlots' ? this._columnService.propertyColumns$ : this._columnService.taxLotColumns$
    return stream.pipe(
      takeUntil(this._unsubscribeAll$),
      tap((columns) => {
        this.columns = columns
        const defaultColumnName = this.type === 'taxlots' ? this.org.property_display_field : this.org.taxlot_display_field
        this.defaultColumn = columns.find((c) => c.column_name === defaultColumnName)
        this.setGrid()
      }),
    )
  }

  setGrid() {
    const colDefMap = {
      taxlots: { idField: 'pm_property_id', idName: 'PM Property ID' },
      properties: { idField: 'jurisdiction_tax_lot_id', idName: 'Jurisdiction Tax Lot ID' },
    }
    const { idField, idName } = colDefMap[this.type]

    this.columnDefs = [
      {
        field: idField,
        headerName: idName,
        cellRenderer: ({ value }) => value as string,
      },
      { field: this.defaultColumn.column_name, headerName: this.defaultColumn.display_name },
      { field: 'Unpair', headerName: 'Unpair' },
    ]
    const otherType = this.type === 'taxlots' ? 'properties' : 'taxlots'
    this.rowData = this.data.map((item) => ({
      [idField]: `<a href="${otherType}/${item.id}/" class="underline">${item.state[idField] as string}</a>`,
      [this.defaultColumn.column_name]: item.state[this.defaultColumn.column_name],
      Unpair: 'x',
    }))
  }

  get gridHeight() {
    const headerHeight = 50
    const gridHeight = this.rowData.length * 40 + headerHeight
    return Math.min(gridHeight, 500)
  }

  onGridReady(agGrid: GridReadyEvent) {
    this.gridApi = agGrid.api
  }

  onFirstDataRendered(params: FirstDataRenderedEvent) {
    params.api.sizeColumnsToFit()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
