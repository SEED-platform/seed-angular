import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import type { Observable } from 'rxjs'
import { Subject, switchMap, takeUntil, tap } from 'rxjs'
import { InventoryService } from '@seed/api/inventory'
import type { Label } from '@seed/api/label'
import { LabelService } from '@seed/api/label'
import { OrganizationService } from '@seed/api/organization'
import { PageComponent } from '@seed/components'
import type { GenericView, InventoryType, PropertyViewResponse, TaxLotViewResponse, ViewResponse } from '../inventory.types'
import { HeaderComponent } from './header.component'
import { HistoryComponent } from './history.component'

@Component({
  selector: 'seed-inventory-detail',
  templateUrl: './detail.component.html',
  imports: [
    CommonModule,
    HeaderComponent,
    HistoryComponent,
    PageComponent,
  ],
})
export class DetailComponent implements OnDestroy, OnInit {
  private _activatedRoute = inject(ActivatedRoute)
  private _inventoryService = inject(InventoryService)
  private _labelService = inject(LabelService)
  private _organizationService = inject(OrganizationService)
  private _router = inject(Router)
  readonly type = this._activatedRoute.snapshot.paramMap.get('type') as InventoryType
  private readonly _unsubscribeAll$ = new Subject<void>()
  view: ViewResponse
  viewId: number
  views: GenericView[]
  selectedView: GenericView
  orgId: number
  labels: Label[]

  pageTitle = this.type === 'taxlots' ? 'Tax Lot Detail' : 'Property Detail'

  ngOnInit(): void {
    this._activatedRoute.paramMap.pipe(
      takeUntil(this._unsubscribeAll$),
      tap(() => { this.viewId = parseInt(this._activatedRoute.snapshot.paramMap.get('id')) }),
      switchMap(() => this.loadView()),
    ).subscribe()
  }

  loadView(): Observable<unknown> {
    console.log('load view')
    return this._organizationService.currentOrganization$.pipe(
      takeUntil(this._unsubscribeAll$),
      switchMap(({ org_id }) => {
        this.orgId = org_id
        return this._inventoryService.getView(org_id, this.viewId, this.type)
      }),
      switchMap((view) => {
        this.view = view
        const id = this.type === 'taxlots'
          ? (view as TaxLotViewResponse).taxlot?.id
          : (view as PropertyViewResponse).property?.id
        return this._inventoryService.getViews(this.orgId, id, this.type)
      }),
      switchMap((views) => {
        this.views = views
        this.selectedView = views.find((v) => v.id === this.viewId)
        return this._labelService.getInventoryLabels(this.orgId, [this.viewId], this.view.cycle.id, this.type)
      }),
      // tap((labels) => {
      // // more action
      // }),
    )
  }

  onChangeView(viewId: number) {
    console.log('change this view', viewId)
    void this._router.navigate([`/${this.type}/${viewId}`])
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
