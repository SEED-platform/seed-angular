import { CommonModule } from '@angular/common'
import type { OnChanges, OnDestroy, SimpleChanges } from '@angular/core'
import { Component, EventEmitter, inject, Input, Output } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { CellClickedEvent, ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import { Subject, takeUntil, tap } from 'rxjs'
import { InventoryService } from '@seed/api/inventory'
import type { Organization } from '@seed/api/organization'
import { ConfigService } from '@seed/services'
import type { InventoryDocument, InventoryType, ViewResponse } from 'app/modules/inventory/inventory.types'
import { DocumentUploadModalComponent } from '../modal/document-upload.component'

@Component({
  selector: 'seed-inventory-detail-documents-grid',
  templateUrl: './documents-grid.component.html',
  imports: [AgGridAngular, AgGridModule, CommonModule, DocumentUploadModalComponent, MatButtonModule, MatIconModule],
})
export class DocumentsGridComponent implements OnChanges, OnDestroy {
  @Input() org: Organization
  @Input() type: InventoryType
  @Input() view: ViewResponse
  @Input() viewId: number
  @Output() refreshDetail = new EventEmitter<null>()
  private _configService = inject(ConfigService)
  private _dialog = inject(MatDialog)
  private _inventoryService = inject(InventoryService)
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
      if (this.gridApi) {
        this.rowData = []
      }
      this.setGrid()
    }
  }

  setGrid() {
    this.columnDefs = [
      { field: 'id', hide: true },
      { field: 'file', hide: true },
      { field: 'file_type', headerName: 'File Type' },
      { field: 'filename', headerName: 'File Name' },
      { field: 'created', headerName: 'Created' },
      { field: 'actions', headerName: 'Actions', cellRenderer: this.actionRenderer },
    ]

    this.rowData = this.view.property.inventory_documents.map(({ id, file, created, file_type, filename }) => ({
      id,
      file,
      created,
      file_type,
      filename,
    }))
  }

  actionRenderer = () => {
    return `
      <div class="flex gap-2 mt-2 align-center">
        <span class="material-icons action-icon cursor-pointer text-secondary" title="Download" data-action="download">cloud_download</span>
        <span class="material-icons action-icon cursor-pointer text-secondary" title="Edit" data-action="delete">clear</span>
      </div>
    `
  }

  get gridHeight() {
    return Math.min(this.rowData.length * 42 + 50, 500)
  }

  onGridReady(agGrid: GridReadyEvent) {
    this.gridApi = agGrid.api
    this.gridApi.sizeColumnsToFit()
    this.gridApi.addEventListener('cellClicked', this.onCellClicked.bind(this) as (event: CellClickedEvent) => void)
  }

  onCellClicked(event: CellClickedEvent) {
    if (event.colDef.field !== 'actions') return

    const target = event.event.target as HTMLElement
    const action = target.getAttribute('data-action')
    const { id, file, filename } = event.data as { id: string; file: string; filename: string }

    if (action === 'download') {
      this.downloadDocument(file, filename)
    } else if (action === 'delete') {
      this.deleteDocument(id)
    }
  }

  downloadDocument(file: string, filename: string) {
    console.log('Developer Note: Downloads will fail until frontend and backend are on the same server')
    const a = document.createElement('a')
    const url = file
    a.href = url
    a.download = filename
    a.click()
  }

  deleteDocument(id: string) {
    if (confirm('Are you sure you want to delete this document?')) {
      this._inventoryService
        .deletePropertyDocument(this.org.id, this.viewId, id)
        .pipe(
          tap(() => {
            this.refreshDetail.emit()
          }),
        )
        .subscribe()
    }
  }

  addDocument() {
    const dialogRef = this._dialog.open(DocumentUploadModalComponent, {
      width: '40rem',
      data: { orgId: this.org.id, viewId: this.viewId },
    })

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => {
          this.refreshDetail.emit()
        }),
      )
      .subscribe()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
