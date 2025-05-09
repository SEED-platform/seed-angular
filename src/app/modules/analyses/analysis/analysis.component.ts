import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import type { OnInit } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatIconModule } from '@angular/material/icon'
import { MatTableModule } from '@angular/material/table'
import { PageComponent } from '@seed/components'
import { RouterLink } from '@angular/router'
import { ActivatedRoute, Router } from '@angular/router'
import { from, map, Observable, Subject, skip, switchMap, takeUntil, tap } from 'rxjs'
import type { AnalysesMessage, Analysis, OriginalView, View } from '@seed/api/analysis'
import { AnalysisService } from '@seed/api/analysis'
import type { Cycle } from '@seed/api/cycle'
import { OrganizationService } from '@seed/api/organization'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import type { CurrentUser } from '@seed/api/user'
import { UserService } from '@seed/api/user'
import { TranslocoService } from '@jsverse/transloco'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-analyses-analysis',
  templateUrl: './analysis.component.html',
  styleUrls: ['../analyses.component.scss'],
  imports: [CommonModule, MatButtonModule, MatCardModule, MatGridListModule, MatIconModule, MatTableModule, PageComponent, RouterLink, SharedImports],
})
export class AnalysisComponent implements OnInit {
  private _route = inject(ActivatedRoute)
  analysisId = Number(this._route.snapshot.paramMap.get('id'))
  analysis: Analysis
  views: View[]
  originalViews: OriginalView[]
  cycles: Cycle[]
  messages: AnalysesMessage[]
  currentUser: CurrentUser
  columnsToDisplay = ['id', 'property', 'messages', 'outputs', 'actions']
  private _router = inject(Router)
  private _analysisService = inject(AnalysisService)
  private _organizationService = inject(OrganizationService)
  private _snackBar = inject(SnackBarService)
  private _userService = inject(UserService)
  private _transloco = inject(TranslocoService)
  private readonly _unsubscribeAll$ = new Subject<void>()

  ngOnInit(): void {
    this._userService.currentUser$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((currentUser) => {
      this.currentUser = currentUser
    })

    this._init()
  }

  cycle(_id: number): string {
    const cycle: Cycle = this.cycles.find((cycle) => cycle.id === _id)
    if (cycle) {
      return cycle.name
    }
    return ''
  }

  getKeys(obj: any): string[] {
    return Object.keys(obj);
  }

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

  private _init() {
    this.analysis = this._route.snapshot.data.analysis as Analysis
    this.views = this._route.snapshot.data.viewsPayload.views as View[]
    this.originalViews = this._route.snapshot.data.viewsPayload.original_views as OriginalView[]
    this.cycles = this._route.snapshot.data.cycles as Cycle[]
    this.messages = this._route.snapshot.data.messages as AnalysesMessage[]
  }
}
