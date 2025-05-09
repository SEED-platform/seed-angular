import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
  selector: 'seed-analyses-analysis-run',
  templateUrl: './analysis-run.component.html',
  styleUrls: ['../analyses.component.scss'],
  imports: [CommonModule, MatButtonModule, MatCardModule, MatGridListModule, MatIconModule, MatTableModule, PageComponent, RouterLink, SharedImports],
})
export class AnalysisRunComponent implements OnInit {
  private _route = inject(ActivatedRoute)
  analysisId = Number(this._route.snapshot.paramMap.get('id'))
  runId = Number(this._route.snapshot.paramMap.get('runId'))
  analysis: Analysis
  view: View
  views: View[]
  originalViews: OriginalView[]
  cycles: Cycle[]
  messages: AnalysesMessage[]
  currentUser: CurrentUser
  columnsToDisplay = ['id', 'property', 'messages', 'outputs']
  private _router = inject(Router)
  private _analysisService = inject(AnalysisService)
  private _organizationService = inject(OrganizationService)
  private _snackBar = inject(SnackBarService)
  private _userService = inject(UserService)
  private _transloco = inject(TranslocoService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  constructor(private _sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    console.log(`Analysis ${this.analysisId}`)
    console.log(`Run ${this.runId}`)
    this._userService.currentUser$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((currentUser) => {
      this.currentUser = currentUser
    })

    this._init()
  }

  sanitizeUrl(url: string): SafeResourceUrl {
    // this is a local file path in the /media dir within SEED backend
    // TODO: we will need to retrieve it with a full path to backend?
    console.log('URL: ', url)
    return this._sanitizer.bypassSecurityTrustResourceUrl(`http://127.0.0.1:8000${url}`)
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
    this.view = this._route.snapshot.data.viewPayload.view as View
    this.views = [this.view]
    this.originalViews = [this._route.snapshot.data.viewPayload.original_view] as OriginalView[]
    this.cycles = this._route.snapshot.data.cycles as Cycle[]
    this.messages = this._route.snapshot.data.messages as AnalysesMessage[]
    console.log('analysis', this.analysis)
    console.log('view', this.view)
    console.log('originalViews', this.originalViews)
    console.log('cycles:', this.cycles)
    console.log('messages:', this.messages)
    console.log(this.view.parsed_results)
  }
}
