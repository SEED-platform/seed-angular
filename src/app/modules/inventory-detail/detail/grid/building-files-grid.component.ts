import { CommonModule } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject, Input } from '@angular/core'
import { AgGridAngular } from 'ag-grid-angular'
import type { CellClickedEvent, ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import { MaterialImports } from '@seed/materials'
import { ConfigService } from '@seed/services'
import type { InventoryType, ViewResponse } from 'app/modules/inventory/inventory.types'

@Component({
  selector: 'seed-inventory-detail-building-files-grid',
  templateUrl: './building-files-grid.component.html',
  imports: [AgGridAngular, CommonModule, MaterialImports],
})
export class BuildingFilesGridComponent implements OnInit {
  @Input() view: ViewResponse
  @Input() type: InventoryType
  private _configService = inject(ConfigService)
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

  ngOnInit(): void {
    this.setBuildingFilesGrid()
  }

  setBuildingFilesGrid() {
    this.setColumnDefs()
    this.setRowData()
  }

  setColumnDefs() {
    this.columnDefs = [
      { field: 'file_type', headerName: 'File Type' },
      { field: 'filename', headerName: 'File Name' },
      { field: 'created', headerName: 'Created' },
      { field: 'actions', headerName: 'Actions', cellRenderer: this.actionRenderer },
    ]
  }

  actionRenderer = () => {
    return `
      <div class="flex gap-2 mt-2 align-center"">
        <span class="material-icons cursor-pointer text-secondary" data-action="download">cloud_download</span>
      </div>
    `
  }

  setRowData() {
    const files = this.view.state.files
    for (const { created, file_type, filename } of files) {
      this.rowData.push({ created, file_type, filename })
    }
  }

  onCellClicked(event: CellClickedEvent) {
    if (event.colDef.field !== 'actions') return
    this.downloadDocument(event.data)
  }

  downloadDocument(data: unknown) {
    const { file, filename } = data as { file: string; filename: string }

    const a = document.createElement('a')
    const url = file
    a.href = url
    a.download = filename
    a.click()
  }

  get gridHeight() {
    return Math.min(this.rowData.length * 42 + 50, 500)
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api
    this.gridApi.sizeColumnsToFit()
  }
}
