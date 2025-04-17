import { CommonModule } from '@angular/common'
import type { OnChanges, OnDestroy, SimpleChanges } from '@angular/core'
import { Component, inject, Input } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import { Subject } from 'rxjs'
import type { Organization } from '@seed/api/organization'
import { ConfigService } from '@seed/services'
import type { InventoryDocument, InventoryType, ViewResponse } from '../../inventory.types'

@Component({
  selector: 'seed-inventory-detail-documents-grid',
  templateUrl: './documents-grid.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    CommonModule,
    MatButtonModule,
    MatIconModule,
  ],
})
export class DocumentsGridComponent implements OnChanges, OnDestroy {
  @Input() org: Organization
  @Input() type: InventoryType
  @Input() view: ViewResponse
  private _configService = inject(ConfigService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  gridApi: GridApi
  gridTheme$ = this._configService.gridTheme$
  columnDefs: ColDef[] = []
  rowData: Record<string, unknown>[] = []
  defaultColDef = {
    sortable: false,
    filter: false,
    resizable: true,
    suppressMovable: true,
  }

  documents: InventoryDocument[]

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.view) {
      this.setGrid()
    }
  }

  setGrid() {
    this.columnDefs = [
      { field: 'file_type', headerName: 'File Type' },
      { field: 'filename', headerName: 'File Name' },
      { field: 'created', headerName: 'Created' },
    ]
    for (const { created, file_type, filename } of this.view.property.inventory_documents) {
      this.rowData.push({ created, file_type, filename })
    }
    const documents = this.view.property.inventory_documents
    this.rowData = documents.map(({ created, file_type, filename }) => ({ created, file_type, filename }))
  }

  get gridHeight() {
    const headerHeight = 50
    const height = this.rowData.length * 40 + headerHeight
    return Math.min(height, 500)
  }

  onGridReady(agGrid: GridReadyEvent) {
    this.gridApi = agGrid.api
    this.gridApi.sizeColumnsToFit()
  }

  addDocument() {
    console.log('add document')
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
