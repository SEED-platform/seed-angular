import { CommonModule } from '@angular/common'
import type { AfterViewInit, OnDestroy } from '@angular/core'
import { Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { AgGridAngular } from 'ag-grid-angular'
import { filter, Subject, tap } from 'rxjs'
import type { Analysis, Cycle, CycleService } from '@seed/api'
import { AnalysisService, UserService } from '@seed/api'
import { AnalysesGridComponent, NotFoundComponent, PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { MaterialImports } from '@seed/materials'

@Component({
  selector: 'seed-analyses',
  templateUrl: './analyses.component.html',
  imports: [
    AnalysesGridComponent,
    AgGridAngular,
    CommonModule,
    MaterialImports,
    NotFoundComponent,
    PageComponent,
    RouterLink,
    SharedImports,
  ],
})
export class AnalysesComponent implements AfterViewInit, OnDestroy {
  private _analysisService = inject(AnalysisService)
  private _cycleService = inject(CycleService)
  private _userService = inject(UserService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  analyses: Analysis[] = []
  cycles: Cycle[] = []
  orgId: number
  ready = false

  ngAfterViewInit() {
    this._userService.currentOrganizationId$
      .pipe(
        tap((orgId) => {
          this.orgId = orgId
          this.getCycles()
          this.getAnalyses()
        }),
      )
      .subscribe()
  }

  getCycles() {
    this._cycleService.cycles$.subscribe((cycles) => (this.cycles = cycles))
  }

  getAnalyses() {
    this._analysisService.analyses$
      .pipe(
        filter(Boolean),
        tap((analyses) => {
          setTimeout(() => {
            // suppress ExpressionChangedAfterItHasBeenCheckedError
            this.analyses = analyses
          })
        }),
      )
      .subscribe()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
