import { CommonModule } from '@angular/common'
import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { ActivatedRoute } from '@angular/router'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { ColDef, GridApi } from 'ag-grid-community'
import type { Observable } from 'rxjs'
import { filter, switchMap, tap } from 'rxjs'
import { InventoryService } from '@seed/api/inventory'
import { OrganizationService } from '@seed/api/organization'
import { PageComponent } from '@seed/components'
import type { InventoryType, ViewResponse } from 'app/modules/inventory/inventory.types'
import { MapComponent } from '../detail'

@Component({
  selector: 'seed-inventory-detial-ubis',
  templateUrl: './ubids.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    CommonModule,
    MapComponent,
    MatIconModule,
    PageComponent,
  ],
})
export class UbidsComponent implements OnInit {
  private _inventoryService = inject(InventoryService)
  private _organizationService = inject(OrganizationService)
  private _route = inject(ActivatedRoute)
  columnDefs: ColDef[]
  gridApi: GridApi
  enableMap = false
  rowData: Record<string, unknown>[] = []
  type: InventoryType
  view: ViewResponse
  viewId: number
  viewDisplayField$: Observable<string>

  ngOnInit() {
    this.getUrlParams().pipe(
      switchMap(() => this.getView()),
    ).subscribe()
  }

  getUrlParams() {
    return this._route.parent.paramMap.pipe(
      tap((params) => {
        this.viewId = parseInt(params.get('id'))
        this.viewDisplayField$ = this._organizationService.getViewDisplayField(this.viewId, 'properties')
        this.type = params.get('type') as InventoryType
        console.log('ubids type', this.type)
      }),
    )
  }

  getView() {
    return this._inventoryService.view$.pipe(
      filter(Boolean),
      tap((view) => {
        this.view = view
        this.enableMap = Boolean(this.view.state.ubid && this.view.state.bounding_box && this.view.state.centroid)
      }),
    )
  }

  createUbid = () => {
    console.log('create ubid')
  }
}
