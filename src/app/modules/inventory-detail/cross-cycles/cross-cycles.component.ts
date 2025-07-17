import { CommonModule } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { ActivatedRoute } from '@angular/router'
import { AgGridAngular } from 'ag-grid-angular'
import type { ColDef, GridApi } from 'ag-grid-community'
import type { Observable } from 'rxjs'
import { tap } from 'rxjs'
import { OrganizationService } from '@seed/api'
import { NotFoundComponent, PageComponent } from '@seed/components'

@Component({
  selector: 'seed-inventory-detail-cross-cycles',
  templateUrl: './cross-cycles.component.html',
  imports: [AgGridAngular, CommonModule, MatIconModule, NotFoundComponent, PageComponent],
})
export class CrossCyclesComponent implements OnInit {
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
}
