import { CommonModule } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { ActivatedRoute } from '@angular/router'
import type { Observable } from 'rxjs'
import { Subject, switchMap, takeUntil, tap } from 'rxjs'
import type { Analysis } from '@seed/api/analysis'
import { AnalysisService } from '@seed/api/analysis'
import { SharedImports } from '@seed/directives'
import { AgGridAngular } from 'ag-grid-angular'
import { AnalysesGridComponent, PageComponent } from '@seed/components'
import { UserService } from '@seed/api/user'
import { InventoryType, ViewResponse } from 'app/modules/inventory/inventory.types'
import { OrganizationService } from '@seed/api/organization'
import { InventoryService } from '@seed/api/inventory'
import { Cycle, CycleService } from '@seed/api/cycle'

@Component({
  selector: 'seed-inventory-detail-analyses',
  templateUrl: './analyses.component.html',
  imports: [
    AnalysesGridComponent,
    AgGridAngular,
    CommonModule,
    MatButtonModule,
    MatIconModule,
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

  // timestampRenderer = (params: { value: string | number | Date }) => {
  //   if (!params.value) {
  //     return '' // Return empty string if no value
  //   }
  //   const date = new Date(params.value) // Convert the value to a Date object
  //   const formattedDate = new Intl.DateTimeFormat('en-US', {
  //     month: '2-digit',
  //     day: '2-digit',
  //     year: 'numeric',
  //     hour: '2-digit',
  //     minute: '2-digit',
  //     hour12: true, // Use 24-hour format
  //   }).format(date)
  //   return formattedDate // Return the formatted date
  // }

  // /**
  //  * Renders a list of highlights as an HTML unordered list.
  //  * Each item in `params.value` is an object with the format: `{ name: string, value: string }`.
  //  *
  //  * @param params - The parameters object containing the `value` property.
  //  * @param params.value - An array of objects where each object has the structure:
  //  * `{ name: string, value: string }`.
  //  * @returns A string representing an HTML unordered list with each item's name in bold
  //  * and its value displayed next to it.
  // */
  // highlightsRenderer = (params: { value: unknown }) => {
  //   const container = document.createElement('div')
  //   container.style.whiteSpace = 'normal' // Allow text wrapping
  //   container.style.lineHeight = '1.5' // Adjust line height for better readability

  //   const highlights = Array.isArray(params.value)
  //     ? params.value.filter(
  //         (item): item is { name: string; value: string } =>
  //           typeof item === 'object' && item !== null && 'name' in item && 'value' in item,
  //       )
  //     : []

  //   const ul = document.createElement('ul')
  //   for (const item of highlights) {
  //     const li = document.createElement('li')
  //     li.innerHTML = `<strong>${item.name}:</strong> ${item.value}`
  //     ul.appendChild(li)
  //   }

  //   container.appendChild(ul)
  //   return container
  // }


  createAnalysis() {
    console.log('Create Analysis')
  }
}
