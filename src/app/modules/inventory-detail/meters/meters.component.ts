import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatSelectModule } from '@angular/material/select'
import { ActivatedRoute } from '@angular/router'
import type { Cycle } from '@seed/api/cycle'
import { CycleService } from '@seed/api/cycle/cycle.service'
import type { Meter, MeterUsage } from '@seed/api/meters'
import { MeterService } from '@seed/api/meters'
import { OrganizationService } from '@seed/api/organization'
import { UserService } from '@seed/api/user'
import { DeleteModalComponent, PageComponent } from '@seed/components'
import { ConfigService } from '@seed/services'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { CellClickedEvent, ColDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community'
import type { ViewResponse } from 'app/modules/inventory/inventory.types'
import { filter, type Observable, Subject, switchMap, takeUntil, tap } from 'rxjs'
import { FormModalComponent } from './modal/form-modal.component'
import { InventoryService } from '@seed/api/inventory'

@Component({
  selector: 'seed-inventory-detail-meters',
  templateUrl: './meters.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    CommonModule,
    PageComponent,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDividerModule,
  ],
})
export class MetersComponent implements OnDestroy, OnInit {
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _configService = inject(ConfigService)
  private _cycleService = inject(CycleService)
  private _dialog = inject(MatDialog)
  private _inventoryService = inject(InventoryService)
  private _meterService = inject(MeterService)
  private _organizationService = inject(OrganizationService)
  private _route = inject(ActivatedRoute)
  private _userService = inject(UserService)
  cycles: Cycle[]
  excludedIds: number[] = []
  gridTheme$ = this._configService.gridTheme$
  interval: 'Exact' | 'Year' | 'Month' = 'Exact'
  groupIds: number[]
  meterDefs: ColDef[] = []
  meterData: Record<string, unknown>[] = []
  meterGridApi: GridApi
  meters: Meter[]
  meterReadings: MeterUsage
  orgId: number
  readingDefs: ColDef[] = []
  readingData: Record<string, unknown>[] = []
  readingGridApi: GridApi
  view: ViewResponse
  viewId: number
  viewDisplayField$: Observable<string>

  defaultColDef = {
    sortable: true,
    filter: true,
    floatingFilter: true,
    resizable: true,
    filterParams: {
      suppressAndOrCondition: true,
    },
  }

  gridOptions: GridOptions = {
    rowSelection: {
      mode: 'multiRow',
      checkboxes: true,
      headerCheckbox: true,
    },
    onSelectionChanged: () => { this.meterSelectionChanged() },
  }

  ngOnInit(): void {
    this.getParams().pipe(
      takeUntil(this._unsubscribeAll$),
      switchMap(() => this._userService.currentOrganizationId$),
      tap((orgId) => { this.orgId = orgId }),
      switchMap(() => this._inventoryService.getPropertyView(this.orgId, this.viewId)),
      tap((view) => {
        this.groupIds = view.property.group_mappings.map((g) => g.group_id)
        this.getDependencies()
      }),
    ).subscribe()
  }

  getParams() {
    return this._route.parent.paramMap.pipe(
      tap((params) => {
        this.viewId = parseInt(params.get('id'))
        this.viewDisplayField$ = this._organizationService.getViewDisplayField(this.viewId, 'properties')
      }),
    )
  }

  getDependencies() {
    this._meterService.list(this.orgId, this.viewId)
    this._meterService.listReadings(this.orgId, this.viewId, this.interval, this.excludedIds)

    this._cycleService.cycles$.subscribe((cycles) => this.cycles = cycles)

    this._meterService.meters$.pipe(
      tap((meters) => {
        this.meters = meters
        this.setMeterGrid()
      }),
    ).subscribe((meters) => this.meters = meters)

    this._meterService.meterReadings$.pipe(
      tap((meterReadings) => {
        this.meterReadings = meterReadings
        this.setReadingGrid()
      }),
    ).subscribe((meterReadings) => this.meterReadings = meterReadings)
  }

  setMeterGrid() {
    this.setMeterData()
    this.setMeterColumnDefs()
  }

  setReadingGrid() {
    this.setReadingData()
    this.setReadingColumnDefs()
  }

  setMeterColumnDefs() {
    this.meterDefs = [
      { field: 'id', hide: true },
      { field: 'alias', headerName: 'Alias', hide: true },
      { field: 'type', headerName: 'Type' }, // needed? alias combines type, source, source id
      { field: 'source', headerName: 'Source' }, // needed? alias combines type, source, source id
      { field: 'source_id', headerName: 'Source ID' }, // needed?
      { field: 'direction', headerName: 'Direction' },
      { field: 'service', headerName: 'Service ID' },
      { field: 'is_virtual', headerName: 'Is Virtual' },
      { field: 'scenario_id', headerName: 'Scenario ID' }, // needed?
      { field: 'scenario_name', headerName: 'Scenario Name' },
      { field: 'actions', headerName: 'Actions', cellRenderer: this.actionRenderer },
    ]

    // hide column if all values are falsey
    const showColumn = (field: string, rowData: Record<string, unknown>[]) => rowData.some((row) => !!row[field])
    this.meterDefs = this.meterDefs.filter((colDef) => colDef.field === 'actions' || showColumn(colDef.field, this.meterData))
  }

  actionRenderer = () => {
    return `
      <div class="flex gap-2 mt-2 align-center">
      <span class="material-icons action-icon cursor-pointer text-secondary" title="Delete" data-action="delete">clear</span>
      ${this.groupIds.length ? '<span class="material-icons action-icon cursor-pointer text-secondary" title="Edit" data-action="edit">edit</span>' : ''}
      </div>
    `
  }

  setReadingColumnDefs() {
    if (!this.meterReadings) return

    const nameMap: Record<string, string> = { end_time: 'End Time', start_time: 'Start Time' }
    this.readingDefs = this.meterReadings.column_defs.map((col: { field: string; displayName?: string }) => {
      return {
        field: col.field,
        headerName: nameMap[col.field] ?? col.displayName,
      }
    })
  }

  setMeterData() {
    this.meterData = this.meters.map((m: Meter) => {
      return { ...m, direction: m.config.direction, service: m.config.service_id }
    })
    setTimeout(() => {
      this.meterGridApi?.selectAll()
    }, 100)
  }

  setReadingData() {
    if (!this.meterReadings) return
    this.readingData = this.meterReadings.readings
  }

  get meterGridHeight() {
    return Math.min(this.meterData.length * 34 + 50, 500)
  }

  get readingGridHeight() {
    const div = document.querySelector('#content')
    if (!div) return 0

    const divHeight = div.getBoundingClientRect().height ?? 1
    return Math.min(this.readingData.length * 29 + 97, divHeight * 0.9)
  }

  onMeterGridReady(agGrid: GridReadyEvent) {
    this.meterGridApi = agGrid.api
    this.meterGridApi.sizeColumnsToFit()
    this.meterGridApi.addEventListener('cellClicked', this.onMeterCellClicked.bind(this) as (event: CellClickedEvent) => void)
  }
  onReadingGridReady(agGrid: GridReadyEvent) {
    this.readingGridApi = agGrid.api
    this.readingGridApi.sizeColumnsToFit()
  }

  onMeterCellClicked(event: CellClickedEvent) {
    if (event.colDef.field !== 'actions') return

    const target = event.event.target as HTMLElement
    const action = target.getAttribute('data-action')
    const { id } = event.data as { id: number }

    const meter = this.meters.find((m) => m.id === id)

    if (action === 'edit') {
      this.editMeter(meter)
    } else if (action === 'delete') {
      this.deleteMeter(meter)
    }
  }

  deleteMeter(meter: Meter) {
    const dialogRef = this._dialog.open(DeleteModalComponent, {
      width: '40rem',
      data: { model: 'Meter', name: meter.alias },
    })

    dialogRef.afterClosed().pipe(
      filter(Boolean),
      switchMap(() => this._meterService.delete(this.orgId, this.viewId, meter.id)),
    ).subscribe()
  }

  editMeter(meter: Meter) {
    this._dialog.open(FormModalComponent, {
      width: '40rem',
      data: { meter, orgId: this.orgId, groupIds: this.groupIds, groupId: null, viewId: this.viewId, },
    })
  }

  intervalChange() {
    this._meterService.listReadings(this.orgId, this.viewId, this.interval)
  }

  meterSelectionChanged() {
    const allIds = this.meters.map((m: Meter) => m.id)
    const selectedIds = this.meterGridApi.getSelectedRows().map((r: { id: number }) => r.id)
    const newExcludedIds = allIds.filter((id) => !selectedIds.includes(id))
    if (newExcludedIds.length === this.excludedIds.length) return

    this.excludedIds = newExcludedIds
    this._meterService.listReadings(this.orgId, this.viewId, this.interval, this.excludedIds)
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
