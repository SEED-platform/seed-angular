import { CommonModule } from '@angular/common'
import { Component, inject, OnDestroy, ViewChild } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import type { MatStepper } from '@angular/material/stepper';
import { MatStepperModule } from '@angular/material/stepper'
import { InventoryService } from '@seed/api/inventory'
import { ProgressResponse } from '@seed/api/progress'
import { Sensor, SensorService } from '@seed/api/sensor'
import { ConfigService } from '@seed/services'
import { ProgressBarObj, UploaderService } from '@seed/services/uploader'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import { Subject, switchMap, takeUntil, tap } from 'rxjs'

@Component({
  selector: 'seed-detail-sensors-upload',
  templateUrl: './sensors-upload.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    MatStepperModule,
    MatProgressBarModule,
  ],
})
export class SensorsUploadModalComponent implements OnDestroy {
  @ViewChild('stepper') stepper!: MatStepper
  private _dialogRef = inject(MatDialogRef<SensorsUploadModalComponent>)
  private _configService = inject(ConfigService)
  private _inventoryService = inject(InventoryService)
  private _uploaderService = inject(UploaderService)
  private _sensorService = inject(SensorService)
  private _snackBar = inject(SnackBarService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  readonly allowedTypes = [
    'text/plain',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/csv',
  ]
  file?: File
  fileId: number
  completed = { 1: false, 2: false }
  gridApi: GridApi
  proposedImports: Sensor[] = []
  gridHeight = 0
  gridTheme$ = this._configService.gridTheme$
  inProgress = false
  progressBarObj: ProgressBarObj = {
    message: '',
    progress: 0,
    complete: false,
    statusMessage: '',
    progressLastUpdated: null,
    progressLastChecked: null,
  }

  columnDefs: ColDef[] = [
    { field: 'display_name', headerName: 'Display Name' },
    { field: 'type', headerName: 'Type' },
    { field: 'location_description', headerName: 'Location Description' },
    { field: 'units', headerName: 'Units' },
    { field: 'column_name', headerName: 'Column Name' },
    { field: 'description', headerName: 'Description' },
  ]

  data = inject(MAT_DIALOG_DATA) as { 
    cycleId: number;
    dataLoggerId: number;
    datasetId: string;
    orgId: number;
    viewId: number;
  }
  dragging = false

  // select file
  step1(fileList: FileList) {
    if (fileList.length !== 1) return
    const { orgId, viewId, dataLoggerId, datasetId } = this.data
    const [file] = fileList
    this.file = file
    const sourceType = 'SensorMetadata'

    return this._uploaderService.fileUpload(orgId, this.file, sourceType, datasetId).pipe(
      takeUntil(this._unsubscribeAll$),
      tap(({ import_file_id }) => {
        this.fileId = import_file_id
        this.completed[1] = true
      }),
      switchMap(() => this._uploaderService.sensorPreview(orgId, viewId, dataLoggerId, this.fileId)),
      tap(({ proposed_imports }) => {
        this.proposedImports = proposed_imports
        this.gridHeight = Math.min(this.proposedImports.length * 35 + 42, 300)
        this.stepper.next()
        this.completed[2] = true
      }),
    ).subscribe()
  }

  step2() {
    this.stepper.next()
    this.inProgress = true
    const { orgId, viewId, cycleId } = this.data

    const failureFn = () => {
      this._snackBar.alert('Failed to delete column')
    }

    const successFn = () => {
      this._sensorService.listSensors(orgId, viewId)
      this._snackBar.success('Sensors uploaded successfully')
      this.close(true)
    }

    this._uploaderService.saveRawData(orgId, cycleId, this.fileId).pipe(
      takeUntil(this._unsubscribeAll$),
      tap((response: ProgressResponse) => { this.progressBarObj.progress = response.progress }),
      switchMap((data) => {
        return this._uploaderService.checkProgressLoop({
          progressKey: data.progress_key,
          offset: 0,
          multiplier: 1,
          successFn,
          failureFn,
          progressBarObj: this.progressBarObj,
        })
      }),
    ).subscribe()
  }

  onGridReady(agGrid: GridReadyEvent) {
    this.gridApi = agGrid.api
  }

  dismiss() {
    this._dialogRef.close()
  }

  close(success = false) {
    this._dialogRef.close(success)
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
