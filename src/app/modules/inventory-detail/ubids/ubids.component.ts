import { CommonModule } from '@angular/common'
import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core'
import { PageComponent } from '@seed/components'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import { ColDef, GridApi } from 'ag-grid-community'
import { MatIconModule } from '@angular/material/icon'
import { OrganizationService } from '@seed/api/organization'
import { ActivatedRoute } from '@angular/router'
import { Observable, tap } from 'rxjs'

@Component({
  selector: 'seed-inventory-detial-ubis',
  templateUrl: './ubids.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    CommonModule,
    PageComponent,
    MatIconModule,
  ],
})
export class UbidsComponent implements OnInit {
  private _organizationService = inject(OrganizationService)
  private _route = inject(ActivatedRoute)
  columnDefs: ColDef[]
  rowData: Record<string, unknown>[] = []
  gridApi: GridApi
  viewId: number
  viewDisplayField$: Observable<string>

  ngOnInit() {
    this.getUrlParams().subscribe()
  }

  getUrlParams() {
    return this._route.parent.paramMap.pipe(
      tap((params) => {
        this.viewId = parseInt(params.get('id'))
        this.viewDisplayField$ = this._organizationService.getViewDisplayField(this.viewId, 'properties')
      }),
    )
  }
  createUbid = () => {
    console.log('create ubid')
  }
}
