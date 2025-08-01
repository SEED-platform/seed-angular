import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute } from '@angular/router'
import { AgGridAngular } from 'ag-grid-angular'
import type { CellClickedEvent, ColDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community'
import { filter, type Observable, Subject, switchMap, takeUntil, tap } from 'rxjs'
import type { Cycle, Dataset, GroupService, Meter, MeterUsage } from '@seed/api'
import { CycleService, DatasetService, GroupsService, MeterService, OrganizationService, UserService } from '@seed/api'
import { DeleteModalComponent, NotFoundComponent, PageComponent } from '@seed/components'
import { MaterialImports } from '@seed/materials'
import { ConfigService } from '@seed/services'
import type { ViewResponse } from 'app/modules/inventory/inventory.types'
import { FormModalComponent } from './modal/form-modal.component'
import { GreenButtonUploadModalComponent } from './modal/green-button-upload-modal.component'

@Component({
  selector: 'seed-inventory-detail-meters',
  templateUrl: './meters.component.html',
  imports: [
    AgGridAngular,
    CommonModule,
    MaterialImports,
    NotFoundComponent,
    PageComponent,
  ],
})
export class MetersComponent implements OnDestroy, OnInit {
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _configService = inject(ConfigService)
  private _cycleService = inject(CycleService)
  private _dialog = inject(MatDialog)
  private _datasetService = inject(DatasetService)
  private _groupsService = inject(GroupsService)
  private _meterService = inject(MeterService)
  private _organizationService = inject(OrganizationService)
  private _route = inject(ActivatedRoute)
  private _userService = inject(UserService)
  cycles: Cycle[]
  datasets: Dataset[]
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
  readingGridHeight = 0
  services: GroupService[] = []
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
    onSelectionChanged: () => {
      this.meterSelectionChanged()
    },
  }

  ngOnInit(): void {
    this.getUrlParams()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        switchMap(() => this._userService.currentOrganizationId$),
        tap((orgId) => {
          this.orgId = orgId
        }),
        tap(() => {
          this.setStreams()
        }),
      )
      .subscribe()
  }

  getUrlParams() {
    return this._route.parent.paramMap.pipe(
      tap((params) => {
        this.viewId = parseInt(params.get('id'))
        this.viewDisplayField$ = this._organizationService.getViewDisplayField(this.viewId, 'properties')
      }),
    )
  }

  setStreams() {
    this._meterService.list(this.orgId, this.viewId)
    this._meterService.listReadings(this.orgId, this.viewId, this.interval, this.excludedIds)
    this._groupsService.listForInventory(this.orgId, [this.viewId], 'properties')

    this._meterService.meters$
      .pipe(
        tap((meters) => {
          this.meters = meters
          this.setMeterGrid()
        }),
      )
      .subscribe((meters) => (this.meters = meters))

    this._meterService.meterReadings$
      .pipe(
        tap((meterReadings) => {
          this.meterReadings = meterReadings
          this.setReadingGrid()
        }),
      )
      .subscribe((meterReadings) => (this.meterReadings = meterReadings))

    this._groupsService.groups$
      .pipe(
        filter(Boolean),
        tap((groups) => {
          this.groupIds = groups.map((g) => g.id)
          this.services = groups
            .map((g) => g.systems || [])
            .flat()
            .map((sys) => sys.services || [])
            .flat()
        }),
      )
      .subscribe()

    this._cycleService.cycles$
      .pipe(
        tap((cycles) => {
          this.cycles = cycles
        }),
      )
      .subscribe()

    this._datasetService.datasets$
      .pipe(
        tap((datasets) => { this.datasets = datasets }),
      )
      .subscribe()
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
      { field: 'service', headerName: 'Service' },
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
      <span class="material-icons cursor-pointer text-secondary" title="Delete" data-action="delete">clear</span>
      ${this.groupIds.length ? '<span class="material-icons cursor-pointer text-secondary" title="Edit" data-action="edit">edit</span>' : ''}
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
      const serviceName = this.services.find((s) => s.id === m.config.service_id)?.name || ''
      return { ...m, direction: m.config.direction, service: serviceName }
    })
    setTimeout(() => {
      if (this.meterGridApi && !this.meterGridApi.isDestroyed()) {
        this.meterGridApi?.selectAll()
      }
    }, 100)
  }

  setReadingData() {
    if (!this.meterReadings) return
    this.readingData = this.meterReadings.readings
    this.getReadingGridHeight()
  }

  get meterGridHeight() {
    if (!this.meterData.length) return 0
    return Math.min(this.meterData.length * 34 + 50, 500)
  }

  getReadingGridHeight() {
    const div = document.querySelector('#content')
    if (!div || !this.readingData?.length) return

    const divHeight = div.getBoundingClientRect().height ?? 1
    this.readingGridHeight = Math.min(this.readingData.length * 29 + 97, divHeight * 0.9)
  }

  onMeterGridReady(agGrid: GridReadyEvent) {
    this.meterGridApi = agGrid.api
    this.meterGridApi.sizeColumnsToFit()
    this.meterGridApi.addEventListener('cellClicked', this.onMeterCellClicked.bind(this) as (event: CellClickedEvent) => void)
  }

  onReadingGridReady(agGrid: GridReadyEvent) {
    this.readingGridApi = agGrid.api
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
      data: { model: 'Meter', instance: meter.alias },
    })

    dialogRef
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this._meterService.delete(this.orgId, this.viewId, meter.id)),
      )
      .subscribe()
  }

  editMeter(meter: Meter) {
    this._dialog.open(FormModalComponent, {
      width: '40rem',
      data: { meter, orgId: this.orgId, groupId: null, viewId: this.viewId },
    })
  }

  uploadGreenButtonData = () => {
    this._dialog.open(GreenButtonUploadModalComponent, {
      width: '40rem',
      data: {
        orgId: this.orgId,
        viewId: this.viewId,
        cycleId: this.cycles[0].id,
        systemId: null,
        datasetId: this.datasets[0].id ?? null,
        interval: this.interval,
        excludedIds: this.excludedIds,
      },
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

  destroyGrids() {
    if (this.meterGridApi) {
      this.meterGridApi.destroy()
      this.meterGridApi = null
    }
    if (this.readingGridApi) {
      this.readingGridApi.destroy()
      this.readingGridApi = null
    }
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
