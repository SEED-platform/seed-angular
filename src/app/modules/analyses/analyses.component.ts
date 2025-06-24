import { CommonModule } from '@angular/common'
import type { AfterViewInit, OnDestroy } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatCardModule } from '@angular/material/card'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatIconModule } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { MatTabsModule } from '@angular/material/tabs'
import { Router, RouterLink } from '@angular/router'
import { ActivatedRoute } from '@angular/router'
import { AgGridAngular } from 'ag-grid-angular'
import type { CellClickedEvent, ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import { filter, Subject, switchMap, tap } from 'rxjs'
import type { Analysis } from '@seed/api/analysis'
import { AnalysisService } from '@seed/api/analysis'
import { type Cycle, CycleService } from '@seed/api/cycle'
import { UserService } from '@seed/api/user'
import { PageComponent } from '@seed/components'
import { DeleteModalComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { ConfigService } from '@seed/services'

@Component({
  selector: 'seed-analyses',
  templateUrl: './analyses.component.html',
  styleUrls: ['./analyses.component.scss'],
  imports: [
    AgGridAngular,
    CommonModule,
    MatCardModule,
    MatDialogModule,
    MatGridListModule,
    MatIconModule,
    MatListModule,
    MatTabsModule,
    PageComponent,
    RouterLink,
    SharedImports,
  ],
})
export class AnalysesComponent implements AfterViewInit, OnDestroy {
  private _analysisService = inject(AnalysisService)
  private _cycleService = inject(CycleService)
  private _configService = inject(ConfigService)
  private _userService = inject(UserService)
  private _dialog = inject(MatDialog)
  private _router = inject(Router)
  private _route = inject(ActivatedRoute)
  private readonly _unsubscribeAll$ = new Subject<void>()
  analyses: Analysis[] = []
  cycles: Cycle[] = []
  gridApi: GridApi
  gridTheme$ = this._configService.gridTheme$
  orgId: number
  gridHeight = 0

  columnDefs: ColDef[]

  ngAfterViewInit() {
    this._userService.currentOrganizationId$.pipe(
      tap((orgId) => {
        this.orgId = orgId
        this.getCycles()
        this.getAnalyses()
      }),
    ).subscribe()
  }

  getCycles() {
    this._cycleService.cycles$.subscribe((cycles) => this.cycles = cycles)
  }

  getAnalyses() {
    this._analysisService.analyses$.pipe(
      tap((analyses) => {
        setTimeout(() => { // ExpressionChangedAfterItHasBeenCheckedError
          this.analyses = analyses
          this.getGridHeight()
          this.setColumnDefs()
        })
      }),
    ).subscribe()
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
    const div = document.querySelector('#content')
    if (!div || !this.analyses?.length) return

    const divHeight = div.getBoundingClientRect().height ?? 1
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

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
