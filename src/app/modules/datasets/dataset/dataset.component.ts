import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute, Router } from '@angular/router'
import { AgGridAngular } from 'ag-grid-angular'
import type { CellClickedEvent, ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import type { Observable } from 'rxjs'
import { filter, of, Subject, switchMap, tap } from 'rxjs'
import type { Cycle } from '@seed/api/cycle'
import { CycleService } from '@seed/api/cycle/cycle.service'
import type { Dataset, ImportFile } from '@seed/api/dataset'
import { DatasetService } from '@seed/api/dataset'
import { UserService } from '@seed/api/user'
import { DeleteModalComponent, PageComponent } from '@seed/components'
import { ConfigService } from '@seed/services'
import { naturalSort } from '@seed/utils'

@Component({
  selector: 'seed-dataset',
  templateUrl: './dataset.component.html',
  imports: [
    AgGridAngular,
    CommonModule,
    PageComponent,
  ],
})
export class DatasetComponent implements OnDestroy, OnInit {
  private _configService = inject(ConfigService)
  private _cycleService = inject(CycleService)
  private _datasetService = inject(DatasetService)
  private _dialog = inject(MatDialog)
  private _route = inject(ActivatedRoute)
  private _router = inject(Router)
  private _userService = inject(UserService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  columnDefs: ColDef[] = []
  cycles: Cycle[] = []
  cyclesMap: Record<number, string>
  dataset: Dataset
  datasetId = this._route.snapshot.params?.id as number
  datasetName$: Observable<string>
  importFiles: ImportFile[] = []
  gridApi: GridApi
  gridTheme$ = this._configService.gridTheme$
  orgId: number

  ngOnInit(): void {
    this._userService.currentOrganizationId$.pipe(
      tap((orgId) => { this.orgId = orgId }),
      switchMap(() => this.getCycles()),
      switchMap(() => this.getDataset()),
    ).subscribe()
  }

  getCycles() {
    return this._cycleService.cycles$.pipe(
      tap((cycles) => {
        this.cycles = cycles
        this.cyclesMap = cycles.reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {})
        console.log('cyclesMap', this.cyclesMap)
      }),
    )
  }

  getDataset() {
    return this._datasetService.get(this.orgId, this.datasetId).pipe(
      tap((dataset) => {
        this.dataset = dataset
        this.formatImportFiles(dataset)
        this.datasetName$ = of(dataset.name)
        this.setColumnDefs()
      }),
    )
  }

  formatImportFiles(dataset: Dataset) {
    const { importfiles } = dataset
    this.importFiles = importfiles.map((f) => ({ ...f, cycle_name: this.cyclesMap[f.cycle] }))
    this.importFiles.sort((a, b) => naturalSort(b.created, a.created))
  }

  setColumnDefs() {
    this.columnDefs = [
      { field: 'id', hide: true },
      { field: 'uploaded_filename', headerName: 'File Name' },
      { field: 'created', headerName: 'Date Imported', valueFormatter: ({ value }: { value: string }) => new Date(value).toLocaleDateString() },
      { field: 'source_type', headerName: 'Source Type' },
      { field: 'num_rows', headerName: 'Record Count' },
      { field: 'cycle_name', headerName: 'Cycle' },
      { field: 'actions', headerName: 'Actions', cellRenderer: this.actionsRenderer, width: 400, suppressSizeToFit: true },
    ]
  }

  actionsRenderer() {
    return `
      <div class="flex gap-2 align-center">
        <span class="inline-flex items-center gap-1 cursor-pointer border rounded-full bg-primary text-white h-8 mt-1 px-3 hover:bg-primary-800" title="Data Mapping" data-action="dataMapping">
          <span class="text-sm">Data Mapping</span>
          <span class="material-icons text-secondary text-sm">open_in_new</span>
        </span>
        <span class="inline-flex items-center gap-1 cursor-pointer border rounded-full h-8 mt-1 px-3 hover:bg-primary-800" title="Data Pairing" data-action="dataPairing">
          <span class="text-sm">Data Pairing</span>
          <span class="material-icons text-secondary text-sm">open_in_new</span>
        </span>
        <span class="material-icons cursor-pointer text-secondary my-auto" title="Download Dataset" data-action="download">cloud_download</span>
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
    if (event.colDef.field !== 'actions') return

    const target = event.event.target as HTMLElement
    const action = target.closest('[data-action]')?.getAttribute('data-action')
    const { id } = event.data as { id: number }

    const importFile = this.importFiles.find((f) => f.id === id)

    if (action === 'delete') {
      this.deleteImportFile(importFile)
    } else if (action === 'download') {
      this.downloadDocument(importFile.file, importFile.uploaded_filename)
    } else if (action === 'dataMapping') {
      void this._router.navigate(['/data/mappings/', importFile.id])
      console.log('data mapping', importFile)
    } else if (action === 'dataPairing') {
      console.log('data pairing', importFile)
    }
  }

  deleteImportFile(importFile: ImportFile) {
    const dialogRef = this._dialog.open(DeleteModalComponent, {
      width: '40rem',
      data: { model: 'Import File', instance: importFile.uploaded_filename },
    })

    dialogRef.afterClosed().pipe(
      filter(Boolean),
      switchMap(() => this._datasetService.deleteFile(this.orgId, importFile.id)),
      switchMap(() => this.getDataset()),
    ).subscribe()
  }

  downloadDocument(file: string, filename: string) {
    console.log('file', file)
    const a = document.createElement('a')
    const url = file
    a.href = url
    a.download = filename
    a.click()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
