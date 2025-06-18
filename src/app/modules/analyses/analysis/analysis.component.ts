import { CommonModule } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { RouterLink } from '@angular/router'
import { ActivatedRoute, Router } from '@angular/router'
import { AgGridAngular } from 'ag-grid-angular'
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import { combineLatest, filter, Subject, switchMap, take, takeUntil, tap } from 'rxjs'
import type { AnalysesMessage, Analysis, OriginalView, View } from '@seed/api/analysis'
import { AnalysisService } from '@seed/api/analysis'
import { CycleService, type Cycle } from '@seed/api/cycle'
import { OrganizationService } from '@seed/api/organization'
import type { CurrentUser } from '@seed/api/user'
import { UserService } from '@seed/api/user'
import { PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { ConfigService } from '@seed/services'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'

@Component({
  selector: 'seed-analyses-analysis',
  templateUrl: './analysis.component.html',
  styleUrls: ['../analyses.component.scss'],
  imports: [
    AgGridAngular,
    CommonModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    PageComponent,
    RouterLink,
    SharedImports,
  ],
})
export class AnalysisComponent implements OnInit {
  private _route = inject(ActivatedRoute)
  private _router = inject(Router)
  private _analysisService = inject(AnalysisService)
  private _configService = inject(ConfigService)
  private _cycleService = inject(CycleService)
  private _organizationService = inject(OrganizationService)
  private _snackBar = inject(SnackBarService)
  private _userService = inject(UserService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  analysisId = Number(this._route.snapshot.paramMap.get('id'))
  analysis: Analysis
  analysisDescription: string
  columnDefs: { analysis: ColDef[]; views: ColDef[] }
  columnsToDisplay = ['id', 'property', 'messages', 'outputs', 'actions']
  currentUser: CurrentUser
  cycles: Cycle[]
  gridApi: GridApi
  gridTheme$ = this._configService.gridTheme$
  messages: AnalysesMessage[]
  orgId: number
  originalViews: OriginalView[]
  views: View[]

  ngOnInit() {
    this._userService.currentOrganizationId$.pipe(
      takeUntil(this._unsubscribeAll$),
      tap((orgId) => { this.orgId = orgId }),
      switchMap(() => this.getCycles()),
      tap(() => { this.getAnalysis() }),
    ).subscribe()
  }

  getCycles() {
    return this._cycleService.cycles$.pipe(
      takeUntil(this._unsubscribeAll$),
      tap((cycles) => { this.cycles = cycles }),
    )
  }

  getAnalysis() {
    this._analysisService.getAnalysis(this.orgId, this.analysisId)
    this._analysisService.getAnalysisViews(this.orgId, this.analysisId)
    this._analysisService.getMessages(this.orgId, this.analysisId)

    combineLatest([
      this._analysisService.analysis$,
      this._analysisService.views$,
      this._analysisService.originalViews$,
      this._analysisService.messages$,
    ]).pipe(
      filter(([analysis, _]) => !!analysis),
      take(1),
      tap(([analysis, views, originalViews, messages]) => {
        this.analysis = analysis
        this.views = views
        this.originalViews = originalViews
        this.messages = messages
        this.analysisDescription = this._analysisService.getAnalysisDescription(analysis)
        this.setColumnDefs()
      }),
    ).subscribe()
  }

  setColumnDefs() {
    this.columnDefs = {
      analysis: [
        { field: 'status', headerName: 'Status', cellRenderer: this.statusRenderer },
        { field: 'number_of_analysis_property_views', headerName: 'Property Count' },
        { field: 'created_at', headerName: 'Created At', valueFormatter: ({ value }: { value: string }) => new Date(value).toLocaleDateString() },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        { field: 'cycles', headerName: 'Cycle', valueFormatter: this.getCycle.bind(this) },
        { field: 'run_duration', headerName: 'Run Duration', valueGetter: this._analysisService.getRunDuration },
      ],
      views: [
        { field: 'id', hide: true },
        { field: 'display_name', headerName: 'Property', cellRenderer: this.propertyRenderer },
        { field: 'results', headerName: 'Results', cellRenderer: this.resultsRenderer },
        { field: 'messages', headerName: 'Messages', cellRenderer: this.messagesRenderer },
        { field: 'outputs', headerName: 'Output Files' },
      ],
    }
  }

  statusRenderer = ({ value }: { value: string }) => {
    const bgColor = value === 'Completed' ? 'bg-green-900 text-white' : value === 'Failed' ? 'bg-red-900 text-white' : ''
    return `<div class="overflow-hidden ${bgColor} px-2">${value}</div>`
  }

  getCycle(params: { value: number[] }): string {
    if (!params.value?.length || !this.cycles.length) return ''
    const cycleId = params.value[0]
    return this.cycles.find((c) => c.id === cycleId)?.name ?? ''
  }

  propertyRenderer = (params: { value: string; data: View }) => {
    const { value, data } = params
    const name = value ?? `Property ${data.property}`
    return `
      <div class="text-primary dark:text-primary-300 cursor-pointer" title="Property Detail" data-action="property">
        ${name}
        <span class="material-icons text-secondary text-sm">open_in_new</span>
      </div>
    `
  }

  resultsRenderer = () => {
    return `
      <div class="text-primary dark:text-primary-300 cursor-pointer" title="Analysis Results" data-action="results">
        Results
        <span class="material-icons text-secondary text-sm">open_in_new</span>
      </div>
    `
  }

  messagesRenderer({ context, data }: { context: { messages: AnalysesMessage[] }; data: View }) {
    const messages = context.messages

    // const messageList = messages
    //   .filter((m) => m.analysis_property_view === data.id)
    //   .map((m) => `<li>${m.user_message}</li>`)
    //   .join('')

    return `
      <ul>
        <li>a</li>
        <li>b</li>
        <li>c</li>
      </ul>
      `

    // return `
    //   <ul>
    //     ${messageList}
    //   </ul>
    //   `
  }

  getRowHeight = (params) => {
    console.log(params)
    return 100
  }

  get latestMessage() {
    if (!this.messages?.length) return ''
    return this.messages[0].user_message ?? ''
  }

  onGridReady(event: GridReadyEvent) {
    this.gridApi = event.api
  }

  
  // ngOnInit(): void {
  //   this._userService.currentUser$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((currentUser) => {
  //     this.currentUser = currentUser
  //   })

  //   this._init()
  // }

  // cycle(_id: number): string {
  //   const cycle: Cycle = this.cycles.find((cycle) => cycle.id === _id)
  //   if (cycle) {
  //     return cycle.name
  //   }
  //   return ''
  // }

  // getKeys(obj: any): string[] {
  //   return Object.keys(obj);
  // }

  // // Return messages filtered by analysis property view
  // filteredMessages(_id: number): AnalysesMessage[] {
  //   return this.messages.filter((item) => item.analysis_property_view === _id)
  // }

  // // calculate run duration from start_time and end_time in minutes and seconds only. don't display hours if hours is 0
  // runDuration(analysis): string {
  //   const start = new Date(analysis.start_time)
  //   const end = new Date(analysis.end_time)
  //   const duration = Math.abs(end.getTime() - start.getTime())
  //   const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
  //   const seconds = Math.floor((duration % (1000 * 60)) / 1000)
  //   return `${minutes}m ${seconds}s`
  // }

  // private _init() {
  //   this.analysis = this._route.snapshot.data.analysis as Analysis
  //   this.views = this._route.snapshot.data.viewsPayload.views as View[]
  //   this.originalViews = this._route.snapshot.data.viewsPayload.original_views as OriginalView[]
  //   this.cycles = this._route.snapshot.data.cycles as Cycle[]
  //   this.messages = this._route.snapshot.data.messages as AnalysesMessage[]
  // }
}
