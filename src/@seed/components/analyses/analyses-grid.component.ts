import { CommonModule } from '@angular/common'
import type { OnChanges, OnInit, SimpleChanges } from '@angular/core'
import { Component, inject, Input } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { Router } from '@angular/router'
import type { Analysis } from '@seed/api/analysis'
import { AnalysisService } from '@seed/api/analysis'
import type { Cycle } from '@seed/api/cycle'
import { DeleteModalComponent } from '@seed/components'
import { ConfigService } from '@seed/services'
import { AgGridAngular } from 'ag-grid-angular'
import type { CellClickedEvent, ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import { filter, switchMap } from 'rxjs'

@Component({
  selector: 'seed-analyses-grid',
  templateUrl: './analyses-grid.component.html',
  imports: [
    AgGridAngular,
    CommonModule,
    MatIconModule,
  ],
})
export class AnalysesGridComponent implements OnChanges, OnInit {
  @Input() orgId: number
  @Input() analyses: Analysis[] = []
  @Input() cycles: Cycle[] = []
  @Input() parentRef!: HTMLDivElement
  private _analysisService = inject(AnalysisService)
  private _configService = inject(ConfigService)
  private _router = inject(Router)
  private _dialog = inject(MatDialog)

  gridApi: GridApi
  gridTheme$ = this._configService.gridTheme$
  gridHeight = 0
  columnDefs: ColDef[] = []

  ngOnInit(): void {
    this.setColumnDefs()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes.analyses?.currentValue as Analysis[])?.length) {
      this.getGridHeight()
    }
  }

  setColumnDefs() {
    this.columnDefs = [
      { field: 'id', hide: true },
      { field: 'name', headerName: 'Name', cellRenderer: this.nameRenderer },
      { field: 'status', headerName: 'Status', cellRenderer: this.statusRenderer },
      { field: 'number_of_analysis_property_views', headerName: 'Property Count' },
      { field: 'service', headerName: 'Service' },
      { field: 'created_at', headerName: 'Created At', valueFormatter: ({ value }: { value: string }) => new Date(value).toLocaleDateString() },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      { field: 'cycles', headerName: 'Cycle', valueFormatter: this.getCycle.bind(this) },
      { field: 'run_duration', headerName: 'Run Duration', valueGetter: this._analysisService.getRunDuration },
      { field: 'actions', headerName: 'Actions', cellRenderer: this.actionRenderer },
    ]
  }

  nameRenderer({ value }: { value: string }) {
    return `
      <div class="text-primary dark:text-primary-300 cursor-pointer" title="Analysis Detail" data-action="detail">
        ${value}
        <span class="material-icons text-secondary text-sm">open_in_new</span>
      </div>
    `
  }

  statusRenderer = ({ value }: { value: string }) => {
    const bgColor = value === 'Completed' ? 'bg-green-900 text-white' : value === 'Failed' ? 'bg-red-900 text-white' : ''
    return `<div class="overflow-hidden ${bgColor} px-2">${value}</div>`
  }

  actionRenderer = () => {
    return `
      <div class="flex gap-2 mt-2 align-center">
      <span class="material-icons action-icon cursor-pointer text-secondary" title="Delete" data-action="delete">clear</span>
      </div>
    `
  }

  getCycle(params: { value: number[] }): string {
    if (!params.value?.length || !this.cycles.length) return ''
    const cycleId = params.value[0]
    return this.cycles.find((c) => c.id === cycleId)?.name ?? ''
  }

  getGridHeight() {
    if (!this.parentRef || !this.analyses?.length) return

    const divHeight = this.parentRef.getBoundingClientRect().height ?? 1
    this.gridHeight = Math.min(this.analyses.length * 42 + 52, divHeight * 0.9)
  }

  onGridReady(agGrid: GridReadyEvent) {
    this.gridApi = agGrid.api
    this.gridApi.sizeColumnsToFit()
    this.gridApi.addEventListener('cellClicked', this.onCellClicked.bind(this) as (event: CellClickedEvent) => void)
  }

  onCellClicked(event: CellClickedEvent) {
    if (!['actions', 'name'].includes(event.colDef.field)) return

    const target = event.event.target as HTMLElement
    const action = target.getAttribute('data-action')
    const { id } = event.data as { id: number }

    const analysis = this.analyses.find((a) => a.id === id)

    if (action === 'delete') {
      this.deleteAnalysis(analysis)
    } else if (action === 'detail') {
      void this._router.navigate([`/analyses/${id}`])
    }
  }

  deleteAnalysis(analysis: Analysis) {
    const dialogRef = this._dialog.open(DeleteModalComponent, {
      width: '40rem',
      data: { model: 'Analysis', instance: analysis.name },
    })

    dialogRef.afterClosed().pipe(
      filter(Boolean),
      switchMap(() => this._analysisService.delete(this.orgId, analysis.id)),
    ).subscribe()
  }
}
