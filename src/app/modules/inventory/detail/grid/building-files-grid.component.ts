import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular';
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { BuildingFile, InventoryType, ViewResponse } from '../../inventory.types';
import { ConfigService } from '@seed/services';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'seed-inventory-detail-building-files-grid',
  templateUrl: './building-files-grid.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    CommonModule,
    MatIconModule,
  ]
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
    this.columnDefs = [
      { field: 'file_type', headerName: 'File Type' },
      { 
        field: 'filename',
        headerName: 'File Name',
        cellRenderer: (params) => {
          return `
            <div style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <span style="text-decoration: underline;">${params.value}</span>
              <span style="margin-left: 5px;" class="ag-icon ag-icon-save">
              </span>
            </div>
          `
        },
        cellRendererParams: {
          onClick: (filename) => {
            console.log('File clicked:', filename)
          }
        }
      },
      { field: 'created', headerName: 'Created' },
    ]
    const files = this.view.state.files as BuildingFile[]

    for (const { created, file_type, filename } of files) {
      this.rowData.push({ created, file_type, filename })
    }
  }

  onCellClicked({ data }) {
    console.log('click', data)
  }

  get gridHeight() {
    const headerHeight = 50
    const height = this.rowData.length * 41 + headerHeight
    return Math.min(height, 500)
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api
    this.gridApi.sizeColumnsToFit()
  }
}
