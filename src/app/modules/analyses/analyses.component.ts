import { CommonModule } from '@angular/common'
import type { AfterViewInit, OnDestroy } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatCardModule } from '@angular/material/card'
import { MatDialogModule } from '@angular/material/dialog'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatIconModule } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { MatTabsModule } from '@angular/material/tabs'
import { RouterLink } from '@angular/router'
import { AgGridAngular } from 'ag-grid-angular'
import { filter, Subject, tap } from 'rxjs'
import type { Analysis } from '@seed/api/analysis'
import { AnalysisService } from '@seed/api/analysis'
import { type Cycle, CycleService } from '@seed/api/cycle'
import { UserService } from '@seed/api/user'
import { AnalysesGridComponent, NotFoundComponent, PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-analyses',
  templateUrl: './analyses.component.html',
  imports: [
    AnalysesGridComponent,
    AgGridAngular,
    CommonModule,
    MatCardModule,
    MatDialogModule,
    MatGridListModule,
    MatIconModule,
    MatListModule,
    MatTabsModule,
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
