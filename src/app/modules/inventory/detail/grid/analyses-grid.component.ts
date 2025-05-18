import { CommonModule } from '@angular/common'
import type { OnInit, SimpleChanges } from '@angular/core'
import { Component, EventEmitter, inject, Input, Output, isDevMode } from '@angular/core';
import { MatButtonModule } from '@angular/material/button'
// import { MatDialog } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { Router } from '@angular/router'
import type { Analysis } from '@seed/api/analysis'
import { AnalysisService } from '@seed/api/analysis'
import { SharedImports } from '@seed/directives'
import { ConfigService } from '@seed/services'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { CellClickedEvent, ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import { Subject } from 'rxjs'

@Component({
  selector: 'seed-inventory-detail-analyses-grid',
  templateUrl: './analyses-grid.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    SharedImports,
  ],
})
export class AnalysesGridComponent implements OnInit {
  @Input() analyses: Analysis[]
  private _analysisService = inject(AnalysisService)
  private _configService = inject(ConfigService)
  private _router = inject(Router)
  // private _dialog = inject(MatDialog)
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

  ngOnInit(): void {
    this.setGrid()
  }

  setGrid() {
    this.columnDefs = [
      { field: 'name', headerName: 'Analysis Name', width: 150 },
      { field: 'id', hide: true },
      { field: 'run_id', headerName: 'Run ID', width: 60 },
      { field: 'service', headerName: 'Type', width: 100 },
      { field: 'status', headerName: 'Status', width: 100 },
      {
        field: 'created_at',
        headerName: 'Created',
        cellRenderer: this.timestampRenderer,
        width: 120,
      },
      {
        field: 'highlights',
        headerName: 'Highlights',
        cellRenderer: this.highlightsRenderer,
        autoHeight: true,
      },
      { field: 'actions', headerName: 'Actions', cellRenderer: this.actionRenderer, width: 70 },
    ]

    for (const { name, id, views, service, status, created_at, highlights } of this.analyses) {
      this.rowData.push({ name, id, run_id: views[0], service, status, created_at, highlights })
    }
  }

  actionRenderer = () => {
    return `
      <div class="flex gap-2 mt-2 align-center"">
        <span class="material-icons action-icon cursor-pointer" data-action="view" aria-label="View Full Analysis">logout</span>
      </div>
    `
  }

  timestampRenderer = (params: { value: string | number | Date }) => {
    if (!params.value) {
      return '' // Return empty string if no value
    }
    const date = new Date(params.value) // Convert the value to a Date object
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true, // Use 24-hour format
    }).format(date)
    return formattedDate // Return the formatted date
  }

  /**
   * Renders a list of highlights as an HTML unordered list.
   * Each item in `params.value` is an object with the format: `{ name: string, value: string }`.
   *
   * @param params - The parameters object containing the `value` property.
   * @param params.value - An array of objects where each object has the structure:
   * `{ name: string, value: string }`.
   * @returns A string representing an HTML unordered list with each item's name in bold
   * and its value displayed next to it.
  */
  highlightsRenderer = (params: { value: unknown }) => {
    const container = document.createElement('div')
    container.style.whiteSpace = 'normal' // Allow text wrapping
    container.style.lineHeight = '1.5' // Adjust line height for better readability

    const highlights = Array.isArray(params.value)
      ? params.value.filter(
          (item): item is { name: string; value: string } =>
            typeof item === 'object' && item !== null && 'name' in item && 'value' in item,
        )
      : []

    const ul = document.createElement('ul')
    for (const item of highlights) {
      const li = document.createElement('li')
      li.innerHTML = `<strong>${item.name}:</strong> ${item.value}`
      ul.appendChild(li)
    }

    container.appendChild(ul)
    return container
  }

  get gridHeight() {
    const headerHeight = 50
    const height = this.rowData.length * 42 + headerHeight
    return Math.min(height, 500)
  }

  getRowHeight = (params: any) => {
    if (params.data && params.data.highlights) {
      return 100 // Adjust this value based on your content
    }
    return 42 // Default row height
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

    const id: number = event.data.id
    const _run_id: number = event.data.run_id

    if (action === 'view') {
      // take user to analysis run page at /analyses/:id/runs/:runId
      if (id && _run_id) {
        void this._router.navigate([`/analyses/${id}/runs/${_run_id}`])
      }
    }
  }
}
