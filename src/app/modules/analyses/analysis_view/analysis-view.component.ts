import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { AgGridAngular } from 'ag-grid-angular'
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import type { Observable } from 'rxjs'
import { combineLatest, filter, Subject, switchMap, takeUntil, tap } from 'rxjs'
import type { AnalysesMessage, Analysis, View } from '@seed/api/analysis'
import { AnalysisService } from '@seed/api/analysis'
import type { Cycle } from '@seed/api/cycle'
import { CycleService } from '@seed/api/cycle'
import { OrganizationService } from '@seed/api/organization'
import { UserService } from '@seed/api/user'
import { NotFoundComponent, PageComponent } from '@seed/components'
import { SafeUrlPipe } from '@seed/pipes/safe-url/safe-url.pipe'
import { ConfigService } from '@seed/services'
import type { InventoryType } from 'app/modules/inventory'

@Component({
  selector: 'seed-analysis-view',
  templateUrl: './analysis-view.component.html',
  imports: [
    AgGridAngular,
    CommonModule,
    MatIconModule,
    MatDividerModule,
    NotFoundComponent,
    PageComponent,
    RouterModule,
    SafeUrlPipe,
  ],
})
export class AnalysisViewComponent implements OnDestroy, OnInit {
  private _route = inject(ActivatedRoute)
  private _analysisService = inject(AnalysisService)
  private _configService = inject(ConfigService)
  private _organizationService = inject(OrganizationService)
  private _userService = inject(UserService)
  private _cycleService = inject(CycleService)
  private readonly _unsubscribeAll$ = new Subject<void>()

  analysisId = Number(this._route.snapshot.paramMap.get('id'))
  analysis: Partial<Analysis> = {}
  analyses: Analysis[] = []
  cycles: Cycle[] = []
  cycle: Partial<Cycle> = {}
  messages: AnalysesMessage[] = []
  orgId: number
  apvId = Number(this._route.snapshot.paramMap.get('viewId')) // analysis_property_view_id
  view: Partial<View> = {}
  propertyViewId: number
  gridApi: GridApi
  viewDisplayField$: Observable<string>
  type: InventoryType = 'properties'
  rowData: Record<string, unknown>[] = []
  gridTheme$ = this._configService.gridTheme$
  columnDefs: ColDef[] = [
    { field: 'key', headerName: 'Field' },
    { field: 'value', headerName: 'Value', cellDataType: 'text' },
  ]

  ngOnInit() {
    this._userService.currentOrganizationId$.pipe(
      tap((orgId) => { this.orgId = orgId }),
      tap(() => {
        this._analysisService.getAnalysis(this.orgId, this.analysisId)
        this._analysisService.getMessages(this.orgId, this.analysisId)
      }),
      switchMap(() => combineLatest([
        this._analysisService.analysis$,
        this._cycleService.cycles$,
        this._analysisService.messages$,
      ])),
      filter(([analysis, cycles, _]) => !!analysis && cycles.length > 0),
      switchMap(([analysis, cycles, messages]) => this.getAnalysisView(analysis, cycles, messages)),
    ).subscribe()
  }

  getAnalysisView(analysis: Analysis, cycles: Cycle[], messages: AnalysesMessage[]) {
    this.analysis = analysis
    this.messages = messages.filter((m) => m.analysis_property_view === this.apvId)

    return this._analysisService.getAnalysisView(this.orgId, this.analysisId, this.apvId).pipe(
      switchMap(() => combineLatest([
        this._analysisService.view$,
        this._analysisService.originalView$,
      ])),
      takeUntil(this._unsubscribeAll$),
      tap(([view, originalView]) => {
        this.view = view
        this.propertyViewId = originalView
        this.cycle = cycles.find((c) => c.id === view.cycle)
        this.viewDisplayField$ = this._organizationService.getViewDisplayField(this.propertyViewId, this.type)
        this.formatTableResults()
      }),
    )
  }

  formatTableResults() {
    // ignore if no parsed results or service is BETTER
    if (!Object.keys(this.view.parsed_results).length || this.analysis.service === 'BETTER') return
    this.rowData = Object.entries(this.view.parsed_results).map(([key, value]) => ({ key, value }))
  }

  onGridReady(event: GridReadyEvent) {
    this.gridApi = event.api
    this.gridApi.sizeColumnsToFit()
  }

  resizeIframe(event: Event) {
    const iframe = event.target as HTMLIFrameElement
    iframe.style.width = '100%'
    iframe.style.height = '100vh'
  }

  downloadOutputFile() {
    const file = this.view.output_files[0]?.file
    const name = file.split('/').pop()?.split('.html')[0]
    const a = document.createElement('a')
    const url = file
    a.href = url
    a.download = name
    a.click()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
