import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { Observable } from 'rxjs'
import { Subject, switchMap, takeUntil, tap } from 'rxjs'
import { InventoryService } from '@seed/api/inventory'
import type { Label } from '@seed/api/label'
import { LabelService } from '@seed/api/label'
import type { Organization } from '@seed/api/organization';
import { OrganizationService } from '@seed/api/organization'
import { PageComponent } from '@seed/components'
import type { GenericView, InventoryType, ViewResponse } from '../inventory.types'
import { HeaderComponent } from './header.component'
import { ColumnService } from '@seed/api/column'
import { ConfigService } from '@seed/services'
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon'
import { BuildingFilesGridComponent, DocumentsGridComponent, HistoryGridComponent, PairedGridComponent } from '.'



@Component({
  selector: 'seed-inventory-detail',
  templateUrl: './detail.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    BuildingFilesGridComponent,
    CommonModule,
    DocumentsGridComponent,
    HeaderComponent,
    HistoryGridComponent,
    MatDividerModule,
    MatIconModule,
    PageComponent,
    PairedGridComponent,
  ],
})
export class DetailComponent implements OnDestroy, OnInit {
  private _activatedRoute = inject(ActivatedRoute)
  private _configService = inject(ConfigService)
  private _columnService = inject(ColumnService)
  private _inventoryService = inject(InventoryService)
  private _labelService = inject(LabelService)
  private _organizationService = inject(OrganizationService)
  private _router = inject(Router)
  private readonly _unsubscribeAll$ = new Subject<void>()
  labels: Label[]
  gridTheme$ = this._configService.gridTheme$
  org: Organization
  orgId: number
  selectedView: GenericView
  type = this._activatedRoute.snapshot.paramMap.get('type') as InventoryType
  view: ViewResponse
  viewId: number
  views: GenericView[]


  pageTitle = this.type === 'taxlots' ? 'Tax Lot Detail' : 'Property Detail'

  ngOnInit(): void {
    this._activatedRoute.paramMap.pipe(
      takeUntil(this._unsubscribeAll$),
      tap(() => { this.viewId = parseInt(this._activatedRoute.snapshot.paramMap.get('id')) }),
      switchMap(() => this.loadView()),
    ).subscribe()
  }

  loadView(): Observable<Label[]> {
    return this._organizationService.currentOrganization$.pipe(
      takeUntil(this._unsubscribeAll$),
      switchMap((organization) => {
        this.org = organization
        this.orgId = organization.org_id
        return this._inventoryService.getView(organization.org_id, this.viewId, this.type)
      }),
      switchMap((view) => {
        this.view = view
        const id = this.type === 'taxlots'
          ? view.taxlot?.id
          : view.property?.id
        return this._inventoryService.getViews(this.orgId, id, this.type)
      }),
      switchMap((views) => {
        this.views = views
        this.selectedView = views.find((v) => v.id === this.viewId)
        return this._labelService.getInventoryLabels(this.orgId, [this.viewId], this.view.cycle.id, this.type)
      }),
      tap((labels: Label[]) => {
        this.labels = labels.filter((label) => label.is_applied.includes(this.selectedView.id))
      }),
    )
  }

  get paired() {
    if (!this.view) return []
    return this.type === 'taxlots' ? this.view.properties : this.view.taxlots
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
