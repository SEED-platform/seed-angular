import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatCardModule } from '@angular/material/card'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatIconModule } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { MatTabsModule } from '@angular/material/tabs'
import { RouterLink } from '@angular/router'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { from, map, Observable, Subject, skip, switchMap, takeUntil, tap } from 'rxjs'
import type { AnalysesMessage, Analysis, OriginalView, View } from '@seed/api/analysis'
import { AnalysisService } from '@seed/api/analysis'
import type { Cycle } from '@seed/api/cycle'
import { OrganizationService } from '@seed/api/organization'
import type { CurrentUser } from '@seed/api/user'
import { UserService } from '@seed/api/user'
import { PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'

import { DeleteAnalysisDialogComponent } from './delete-analysis-dialog'
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import { AgGridAngular } from 'ag-grid-angular'
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
export class AnalysesComponent implements OnInit, OnDestroy {
  private _configService = inject(ConfigService)
  private _dialog = inject(MatDialog)
  private _route = inject(ActivatedRoute)
  private _router = inject(Router)
  private _analysisService = inject(AnalysisService)
  private _organizationService = inject(OrganizationService)
  private _snackBar = inject(SnackBarService)
  private _transloco = inject(TranslocoService)
  private _userService = inject(UserService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  analyses: Analysis[]
  views: View[]
  originalViews: OriginalView[]
  cycles: Cycle[]
  messages: AnalysesMessage[]
  currentUser: CurrentUser
  gridTheme$ = this._configService.gridTheme$
  gridApi: GridApi

  columnDefs: ColDef[] = [
    { field: 'name', headerName: 'Name' },
    { field: 'service', headerName: 'Service' },
  ]

  rowData = [
    { name: 'n1', service: 's1' },
    { name: 'n2', service: 's2' },
    { name: 'n3', service: 's3' },
    { name: 'n4', service: 's4' },
    { name: 'n5', service: 's5' },
  ]

  gridHeight = 500

  onGridReady(agGrid: GridReadyEvent) {
    this.gridApi = agGrid.api
    this.gridApi.sizeColumnsToFit()
  }

  ngOnInit(): void {
    this._userService.currentUser$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((currentUser) => {
      this.currentUser = currentUser
    })

    this._init()

    // Subscribe to the analyses$ observable to keep the analyses list in sync
    this._analysisService.analyses$
      .pipe(takeUntil(this._unsubscribeAll$)) // Automatically unsubscribe when the component is destroyed
      .subscribe((analyses) => {
        this.analyses = analyses
      })

    // Rerun resolver and initializer on org change
    this._organizationService.currentOrganization$.pipe(skip(1)).subscribe(() => {
      from(this._router.navigate([this._router.url])).subscribe(() => {
        this._init()
      })
    })

    // TODO - subscribe to the list of pending analyses. (call poll function with list of IDs)
    // function in tap that handles the function. figure out the list here (maintain the list)
    // I will update the observable when the status changes.
    // when it changes, remove from the list and change the status.
    // take updated analysis and replace in this._analyses
    // figure out which ones are pending and poll those via service
  }

  ngOnDestroy(): void {
    // Clean up subscriptions and other resources
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  cycle(_id: number): string {
    const cycle: Cycle = this.cycles.find((cycle) => cycle.id === _id)
    if (cycle) {
      return cycle.name
    }
    return ''
  }

  // add flag to the analysis indicating it has no currently running tasks
  // Used to determine if we should indicate on UI if an analysis's status is being polled
  mark_analysis_not_active(analysis_id: number): void {
    const analysis_index = this.analyses.findIndex((analysis) => analysis.id === analysis_id)
    this.analyses[analysis_index]._finished_with_tasks = true
  };

  // Return messages filtered by analysis property view
  filteredMessages(_id: number): AnalysesMessage[] {
    return this.messages.filter((item) => item.analysis_property_view === _id)
  }

  // calculate run duration from start_time and end_time in minutes and seconds only. don't display hours if hours is 0
  runDuration(analysis): string {
    const start = new Date(analysis.start_time)
    const end = new Date(analysis.end_time)
    const duration = Math.abs(end.getTime() - start.getTime())
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((duration % (1000 * 60)) / 1000)
    return `${minutes}m ${seconds}s`
  }

  trackById(index: number, item: { id: number }): number {
    return item.id
  }

  trackByIdAndStatus(item: Analysis): string {
    return `${item.id}-${item.status}`
  }

  getKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  deleteAnalysis(analysis: Analysis): void {
    const dialogRef = this._dialog.open(DeleteAnalysisDialogComponent, {
      width: '40rem',
      data: { analysis },
    })

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap((result) => {
          if (result != 'canceled') { // Only proceed if the dialog confirms deletion
            // Remove the analysis and related data
            this.analyses = this.analyses.filter((item) => item.id !== analysis.id)
            this.views = this.views.filter((item) => item.analysis !== analysis.id)
            this.messages = this.messages.filter((item) => item.analysis_property_view !== analysis.id)

            // Fetch the translated string and show a snackbar
            const successMessage = this._transloco.translate('Analysis Deleted Successfully')
            this._snackBar.success(successMessage)
          }
        }),
      )
      .subscribe()
  }

  private _init() {
    this.analyses = this._route.snapshot.data.analyses.analyses as Analysis[]
    this.views = this._route.snapshot.data.analyses.views as View[]
    this.originalViews = this._route.snapshot.data.analyses.original_views as OriginalView[]
    this.cycles = this._route.snapshot.data.cycles as Cycle[]
    this.messages = this._route.snapshot.data.messages as AnalysesMessage[]

    // go through the analyses and make a list of those analyses where analysis.status is any of the following statuses: "Pending Creation", "Creating", "Ready", "Queued", "Running"
    // then subscribe to "pollAnalyses" in the analysis service and when updated data comes in,
    // replace the entry in the main analyses object.
    this._analysisService.pollForCompletion(
      this.analyses.filter((analysis) =>
        ['Pending Creation', 'Creating', 'Ready', 'Queued', 'Running'].includes(analysis.status),
      ),
    )
      .pipe(
        tap((response) => {
          // Update the analyses list with the updated analyses
          this.analyses = this.analyses.map((analysis) => {
            const updatedAnalysis = response.analyses.find((updated) => updated.id === analysis.id)
            return updatedAnalysis ? updatedAnalysis : analysis
          })
        }),
        takeUntil(this._unsubscribeAll$), // Automatically unsubscribe when the component is destroyed
      )
      .subscribe({
        next: () => {
          console.log('Polling completed successfully.')
        },
        error: (err) => {
          console.error('Error during polling:', err)
        },
      })
  }
}
