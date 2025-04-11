import { CommonModule } from '@angular/common'
import { Component, inject, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core'
import { ConfigService } from '@seed/services'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import { InventoryType, ViewResponse } from '../../inventory.types'
import { Observable } from 'rxjs'
import { Column, ColumnService } from '@seed/api/column'
import { of, Subject, takeUntil, tap } from 'rxjs'
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import { Organization } from '@seed/api/organization'
import { MatIconModule } from '@angular/material/icon'


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
    if (!this.data.length) return of([])

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
      'taxlots': { idField: 'pm_property_id', idName: 'PM Property ID', },
      'properties': { idField: 'jurisdiction_tax_lot_id', idName: 'Jurisdiction Tax Lot ID', },
    }
    const { idField, idName } = colDefMap[this.type]

    this.columnDefs = [
      { field: idField, headerName: idName },
      { field: this.defaultColumn.column_name, headerName: this.defaultColumn.display_name },
      { field: 'Unpair', headerName: 'Unpair' },
    ]


    for (const item of this.data) {
      const row = {
        [idField]: item.state[idField],
        [this.defaultColumn.column_name]: item.state[this.defaultColumn.column_name],
        Unpair: 'x',
      }
      this.rowData.push(row)
    }
  }

  get gridHeight() {
    const headerHeight = 50
    const gridHeight = this.rowData.length * 40 + headerHeight
    return Math.min(gridHeight, 500)
  }

  onGridReady(agGrid: GridReadyEvent) {
    this.gridApi = agGrid.api
    this.gridApi.sizeColumnsToFit()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

}