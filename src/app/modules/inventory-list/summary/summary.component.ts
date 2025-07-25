import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { AgGridAngular } from 'ag-grid-angular'
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import { catchError, EMPTY, Subject, switchMap, takeUntil, tap } from 'rxjs'
import type { AnalysisSummary, AnalysisSummaryStats, CurrentUser, OrgCycle } from '@seed/api'
import { AnalysisService, OrganizationService, UserService } from '@seed/api'
import { NotFoundComponent, PageComponent } from '@seed/components'
import { MaterialImports } from '@seed/materials'
import { ConfigService } from '@seed/services'
import type { InventoryType } from 'app/modules/inventory/inventory.types'

type CellRendererParams = { value: string; data: { is_extra_data: boolean } }

@Component({
  selector: 'seed-inventory-list-summary',
  templateUrl: './summary.component.html',
  imports: [AgGridAngular, CommonModule, MaterialImports, NotFoundComponent, PageComponent],
})
export class SummaryComponent implements OnDestroy, OnInit {
  private _analysisService = inject(AnalysisService)
  private _configService = inject(ConfigService)
  private _organizationService = inject(OrganizationService)
  private _userService = inject(UserService)
  private _route = inject(ActivatedRoute)
  private readonly _unsubscribeAll$ = new Subject<void>()

  columnDefs: ColDef[] = []
  currentUser: CurrentUser
  cycleId: number
  cycles: OrgCycle[] = []
  defaultColDef = { suppressMovable: true }
  gridApi: GridApi
  gridTheme$ = this._configService.gridTheme$
  orgId: number
  rowData: AnalysisSummaryStats[] = []
  summary: AnalysisSummary
  type = this._route.snapshot.paramMap.get('type') as InventoryType
  totalRecords: string
  totalExtraData: string

  ngOnInit() {
    this.initPage().pipe(takeUntil(this._unsubscribeAll$)).subscribe()
  }

  initPage() {
    return this._userService.currentUser$.pipe(
      switchMap((user) => this.getDependencies(user)),
      tap(() => {
        this.setGrid()
      }),
    )
  }

  getDependencies(user: CurrentUser) {
    this.currentUser = user
    this.orgId = user.org_id
    return this._organizationService.getById(this.orgId).pipe(
      tap((org) => {
        this.cycles = org.cycles
        this.cycleId = this.currentUser.settings.cycleId ?? org.cycles[0].cycle_id
      }),
      switchMap(() => this._analysisService.summary(this.orgId, this.cycleId)),
      tap((summary) => {
        this.totalRecords = summary.total_records.toLocaleString()
        this.totalExtraData = summary.number_extra_data_fields.toLocaleString()
        this.summary = summary
      }),
      catchError(() => {
        this.rowData = []
        return EMPTY
      }),
    )
  }

  setGrid() {
    this.setColumnDefs()
    this.setRowData()
  }

  setColumnDefs() {
    this.columnDefs = [
      { field: 'display_name', headerName: 'Field', filter: true, floatingFilter: true, cellRenderer: this.columnRenderer },
      { field: 'count', headerName: 'Count' },
      { field: 'is_extra_data', hide: true },
    ]
  }

  columnRenderer = (params: CellRendererParams) => {
    const value = params.value
    const { is_extra_data } = params.data
    return !is_extra_data ? value : `${value} <span class="material-icons align-middle ml-1 mb-2 text-secondary text-xs">emergency</span>`
  }

  onGridReady(agGrid: GridReadyEvent) {
    this.gridApi = agGrid.api
    this.gridApi.sizeColumnsToFit()
  }

  setRowData() {
    this.rowData = this.summary.stats
  }

  selectCycle(cycleId: number) {
    this.currentUser.settings.cycleId = cycleId
    this.updateOrgUserSettings()
      .pipe(switchMap(() => this.initPage()))
      .subscribe()
  }

  updateOrgUserSettings() {
    return this._organizationService.updateOrganizationUser(this.currentUser.org_user_id, this.orgId, this.currentUser.settings)
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
