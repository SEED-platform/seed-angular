import { CommonModule } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { ActivatedRoute } from '@angular/router'
import { AgGridAngular } from 'ag-grid-angular'
import type { Observable } from 'rxjs'
import { Subject, switchMap, takeUntil, tap } from 'rxjs'
import type { Analysis } from '@seed/api/analysis'
import { AnalysisService } from '@seed/api/analysis'
import type { Cycle } from '@seed/api/cycle'
import { CycleService } from '@seed/api/cycle'
import { InventoryService } from '@seed/api/inventory'
import { OrganizationService } from '@seed/api/organization'
import { UserService } from '@seed/api/user'
import { AnalysesGridComponent, NotFoundComponent, PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import type { InventoryType, ViewResponse } from 'app/modules/inventory/inventory.types'

@Component({
  selector: 'seed-inventory-detail-analyses',
  templateUrl: './analyses.component.html',
  imports: [
    AnalysesGridComponent,
    AgGridAngular,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    NotFoundComponent,
    PageComponent,
    SharedImports,
  ],
})
export class AnalysesComponent implements OnInit {
  private _analysisService = inject(AnalysisService)
  private _cycleService = inject(CycleService)
  private _userService = inject(UserService)
  private _organizationService = inject(OrganizationService)
  private _inventoryService = inject(InventoryService)
  private _route = inject(ActivatedRoute)
  private readonly _unsubscribeAll$ = new Subject<void>()
  analyses: Analysis[] = []
  cycles: Cycle[] = []
  orgId: number
  viewDisplayField$: Observable<string>
  viewId: number
  view: ViewResponse
  type: InventoryType

  defaultColDef = {
    sortable: false,
    filter: false,
    resizable: true,
    suppressMovable: true,
  }

  ngOnInit(): void {
    this.getParams().pipe(
      switchMap(() => this._userService.currentOrganizationId$),
      tap((orgId) => { this.orgId = orgId }),
      switchMap(() => this._cycleService.cycles$),
      tap((cycles) => { this.cycles = cycles }),
      tap(() => { this.watchAnalyses() }),
    ).subscribe()
  }

  getParams() {
    return this._route.parent.paramMap.pipe(
      tap((params) => {
        this.viewId = parseInt(params.get('id'))
        this.type = params.get('type') as InventoryType
        this.viewDisplayField$ = this._organizationService.getViewDisplayField(this.viewId, this.type)
      }),
    )
  }

  getAnalyses() {
    return this._inventoryService.getView(this.orgId, this.viewId, this.type).pipe(
      tap((view) => { this.view = view }),
      switchMap(() => {
        const id = this.type === 'taxlots' ? this.view.taxlot.id : this.view.property.id
        return this._analysisService.getPropertyAnalyses(id)
      }),
      tap((analyses) => { this.analyses = analyses }),
    )
  }

  watchAnalyses() {
    this._analysisService.analyses$.pipe(
      takeUntil(this._unsubscribeAll$),
      switchMap(() => this.getAnalyses()),
    ).subscribe()
  }

  createAnalysis() {
    console.log('Create Analysis')
  }
}
