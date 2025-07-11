import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { ActivatedRoute, Router } from '@angular/router'
import { AgGridAngular } from 'ag-grid-angular'
import type { CellClickedEvent, ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import { combineLatest, filter, Subject, switchMap, takeUntil, tap } from 'rxjs'
import type { Cycle } from '@seed/api/cycle'
import { CycleService } from '@seed/api/cycle/cycle.service'
import { type Dataset, DatasetService } from '@seed/api/dataset'
import { UserService } from '@seed/api/user'
import { DeleteModalComponent, PageComponent } from '@seed/components'
import { ConfigService } from '@seed/services'
import { naturalSort } from '@seed/utils'
import { DataUploadModalComponent } from './data-upload/data-upload-modal.component'
import { MeterDataUploadModalComponent } from './data-upload/meter-upload-modal.component'
import { FormModalComponent } from './modal/form-modal.component'

@Component({
  selector: 'seed-data',
  templateUrl: './datasets.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [
    AgGridAngular,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageComponent,
  ],
})
export class DatasetsComponent implements OnDestroy, OnInit {
  private _configService = inject(ConfigService)
  private _cycleService = inject(CycleService)
  private _datasetService = inject(DatasetService)
  private _route = inject(ActivatedRoute)
  private _router = inject(Router)
  private _userService = inject(UserService)
  private _dialog = inject(MatDialog)
  private readonly _unsubscribeAll$ = new Subject<void>()
  columnDefs: ColDef[]
  cycles: Cycle[] = []
  datasets: Dataset[]
  datasetsColumns = ['name', 'importfiles', 'updated_at', 'last_modified_by', 'actions']
  existingNames: string[] = []
  gridApi: GridApi
  gridTheme$ = this._configService.gridTheme$
  orgId: number

  ngOnInit(): void {
    // Rerun resolver and initializer on org change
    // this._userService.currentOrganizationId$.pipe(skip(1)).subscribe(() => {
    //   from(this._router.navigate([this._router.url])).subscribe(() => {
    //     this._init()
    //   })
    // })

    this._userService.currentOrganizationId$.pipe(
      tap((orgId) => {
        this.orgId = orgId
        this._datasetService.list(orgId)
      }),
      switchMap(() => combineLatest([
        this._cycleService.cycles$,
        this._datasetService.datasets$,
      ])),
      tap(([cycles, datasets]) => {
        this.cycles = cycles
        this.datasets = datasets.sort((a, b) => naturalSort(a.name, b.name))
        this.existingNames = datasets.map((ds) => ds.name)
        this.setColumnDefs()
      }),
      takeUntil(this._unsubscribeAll$),
    ).subscribe()
  }

  setColumnDefs() {
    this.columnDefs = [
      { field: 'id', hide: true },
      { field: 'name', headerName: 'Name', cellRenderer: this.nameRenderer },
      { field: 'importfiles', headerName: 'Files', flex: 0.5, valueGetter: ({ data }: { data: Dataset }) => data.importfiles.length },
      { field: 'updated_at', headerName: 'Updated At', flex: 0.5, valueGetter: ({ data }: { data: Dataset }) => new Date(data.updated_at).toLocaleDateString() },
      { field: 'last_modified_by', headerName: 'Last Modified By' },
      { field: 'actions', headerName: 'Actions', cellRenderer: this.actionsRenderer, flex: 1 },
    ]
  }

  nameRenderer({ value }: { value: string }) {
    return `
      <div class="text-primary dark:text-primary-300 cursor-pointer" title="Dataset Detail" data-action="detail">
        ${value}
        <span class="material-icons text-secondary text-sm">open_in_new</span>
      </div>
    `
  }

  actionsRenderer() {
    return `
      <div class="flex gap-2 align-center">
      <span class="inline-flex items-center gap-1 cursor-pointer border rounded-full bg-primary text-white h-8 mt-1 px-3 hover:bg-primary-800" title="Add Data Files" data-action="addDataFiles">
        <span class="material-icons text-base">add</span>
        <span class="text-sm">Data Files</span>
      </span>
      <span class="inline-flex items-center gap-1 cursor-pointer border rounded-full h-8 mt-1 px-3 hover:bg-gray-400" title="Add Meter Data" data-action="addMeterData">
        <span class="material-icons text-base">add</span>
        <span class="text-sm">Meter Data</span>
      </span>
      <span class="material-icons cursor-pointer text-secondary my-auto" title="Rename Dataset" data-action="rename">edit</span>
      <span class="material-icons cursor-pointer text-secondary my-auto" title="Delete Dataset" data-action="delete">clear</span>
      </div>
    `
  }

  onGridReady(agGrid: GridReadyEvent) {
    this.gridApi = agGrid.api
    this.gridApi.sizeColumnsToFit()
    this.gridApi.addEventListener('cellClicked', this.onCellClicked.bind(this) as (event: CellClickedEvent) => void)
  }

  onCellClicked(event: CellClickedEvent) {
    if (!['actions', 'name'].includes(event.colDef.field)) return

    const target = event.event.target as HTMLElement
    const action = target.closest('[data-action]')?.getAttribute('data-action')
    const { id } = event.data as { id: number }
    const dataset = this.datasets.find((ds) => ds.id === id)

    if (action === 'addDataFiles') {
      this._dialog.open(DataUploadModalComponent, {
        width: '40rem',
        data: { orgId: this.orgId, dataset, cycles: this.cycles },
      })
    } else if (action === 'addMeterData') {
      this._dialog.open(MeterDataUploadModalComponent, {
        width: '60rem',
        data: { orgId: this.orgId, datasetId: dataset.id },
      })
    } else if (action === 'rename') {
      this.editDataset(dataset)
    } else if (action === 'delete') {
      this.deleteDataset(dataset)
    } else if (action === 'detail') {
      void this._router.navigate([`/data/${id}`])
    }
  }

  editDataset(dataset: Dataset) {
    const existingNames = this.existingNames.filter((n) => n !== dataset.name)
    this._dialog.open(FormModalComponent, {
      width: '40rem',
      data: { orgId: this.orgId, dataset, existingNames },
    })
  }

  deleteDataset(dataset: Dataset) {
    const dialogRef = this._dialog.open(DeleteModalComponent, {
      width: '40rem',
      data: { model: 'Dataset', instance: dataset.name },
    })

    dialogRef.afterClosed().pipe(
      filter(Boolean),
      switchMap(() => this._datasetService.delete(this.orgId, dataset.id)),
    ).subscribe()
  }

  createDataset = () => {
    this._dialog.open(FormModalComponent, {
      width: '40rem',
      data: { orgId: this.orgId, dataset: null, existingNames: this.existingNames },
    })
  }

  trackByFn(_index: number, { id }: Dataset) {
    return id
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
