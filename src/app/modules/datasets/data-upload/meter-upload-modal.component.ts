import { CommonModule } from '@angular/common'
import type { AfterViewInit, OnDestroy } from '@angular/core'
import { Component, inject, ViewChild } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import type { MatStepper } from '@angular/material/stepper';
import { MatStepperModule } from '@angular/material/stepper'
import { AgGridAngular } from 'ag-grid-angular'
import type { ColDef } from 'ag-grid-community'
import { catchError, EMPTY, Subject, switchMap, takeUntil, tap } from 'rxjs'
import { ModalHeaderComponent, ProgressBarComponent } from '@seed/components'
import { ConfigService } from '@seed/services'
import { UploaderService } from '@seed/services/uploader/uploader.service'
import type { MeterImport, ProgressBarObj, ValidatedTypeUnit } from '@seed/services/uploader/uploader.types'
import { csvDownload } from '@seed/utils'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'

@Component({
  selector: 'seed-meter-data-upload-modal',
  templateUrl: './meter-upload-modal.component.html',
  imports: [
    AgGridAngular,
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    MatProgressBarModule,
    ModalHeaderComponent,
    MatStepperModule,
    ProgressBarComponent,
  ],
})
export class MeterDataUploadModalComponent implements AfterViewInit, OnDestroy {
  @ViewChild('stepper') stepper!: MatStepper

  private _dialogRef = inject(MatDialogRef<MeterDataUploadModalComponent>)
  private _configService = inject(ConfigService)
  private _uploaderService = inject(UploaderService)
  private _snackBar = inject(SnackBarService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  readonly allowedTypes = [
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/csv',
    'text/plain',
  ]
  file?: File
  fileId: number
  cycleId: number
  completed = { 1: false, 2: false, 3: false }
  inProgress = false
  readingGridTitle: string
  uploading = false
  gridTheme$ = this._configService.gridTheme$
  progressBarObj: ProgressBarObj = this._uploaderService.defaultProgressBarObj
  proposedImports: MeterImport[] = []
  readingHeight = 0
  importedMeters: MeterImport[] = []
  step1ProgressTitle = 'Uploading file...'
  unitHeight = 0
  validatedTypeUnits: ValidatedTypeUnit[] = []
  validFile = false
  readingDefs: ColDef[] = [
    { field: 'pm_property_id', headerName: 'PM Property ID' },
    { field: 'cycles', headerName: 'Cycles' },
    { field: 'source_id', headerName: 'PM Meter ID' },
    { field: 'type', headerName: 'Type' },
    { field: 'incoming', headerName: 'Incoming' },
  ]
  importedDefs: ColDef[] = [
    ...this.readingDefs,
    { field: 'successfully_imported', headerName: 'Successfully Imported' },
    { field: 'errors', headerName: 'Errors' },
  ]
  unitDefs: ColDef[] = [
    { field: 'parsed_type', headerName: 'Type', flex: 1 },
    { field: 'parsed_unit', headerName: 'Unit', flex: 1 },
  ]

  data = inject(MAT_DIALOG_DATA) as { datasetId: string; orgId: number; cycleId: number; file: File }

  ngAfterViewInit(): void {
    // if a file is passed, start upload immediately (from the property upload stepper)
    if (this.data.file) {
      this.skipToStep1()
    }
  }

  step1(fileList: FileList) {
    if (fileList.length !== 1) return
    const { orgId, datasetId } = this.data
    const [file] = fileList
    this.file = file
    const sourceType = 'PM Meter Usage'
    this.uploading = true

    return this._uploaderService
      .fileUpload(orgId, this.file, sourceType, datasetId)
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(({ import_file_id }) => {
          this.fileId = import_file_id
          this.completed[1] = true
          this.step1ProgressTitle = 'Analyzing file...'
        }),
        switchMap(() => this._uploaderService.metersPreview(orgId, this.fileId)),
        tap((response) => {
          const { proposed_imports, validated_type_units } = response
          this.setReadingTitle(proposed_imports)
          this.proposedImports = proposed_imports
          this.validatedTypeUnits = validated_type_units
          this.readingHeight = Math.min(this.proposedImports.length * 35 + 42, 250)
          this.unitHeight = Math.min(this.validatedTypeUnits.length * 35 + 42, 200)
          this.stepper.next()
          this.completed[2] = true
          this.uploading = false
        }),
        catchError(() => {
          this.uploading = false
          return EMPTY
        }),
      )
      .subscribe()
  }

  step3() {
    this.stepper.next()
    this.inProgress = true
    const { orgId, cycleId } = this.data

    const successFn = () => {
      this.completed[3] = true
      this.importedMeters = this.progressBarObj.message as MeterImport[]
      this.setReadingTitle(this.importedMeters)
      setTimeout(() => {
        this.stepper.next()
      })
    }

    const failureFn = () => this.inProgress = false

    this._uploaderService.saveRawData(orgId, cycleId, this.fileId)
      .pipe(
        switchMap(({ progress_key }) => this._uploaderService.checkProgressLoop({
          progressKey: progress_key,
          successFn,
          failureFn,
          progressBarObj: this.progressBarObj,
        })),
      )
      .subscribe()
  }

  setReadingTitle(meterImports: MeterImport[]) {
    const meterCount = meterImports.length
    const propertyCount = new Set(meterImports.map((m) => m.pm_property_id)).size
    this.readingGridTitle = `${meterCount > 1 ? `${meterCount} Meters` : '1 Meter'} from ${propertyCount > 1 ? `${propertyCount} Properties` : '1 Property'}`
  }

  csvDownload(title: 'proposed_meter_imports' | 'validated_type_units' | 'imported_meters') {
    const data = {
      proposed_meter_imports: this.proposedImports,
      validated_type_units: this.validatedTypeUnits,
      imported_meters: this.importedMeters,
    }
    csvDownload(title, data[title])
  }

  skipToStep1() {
    const fileList = this.createFileList(this.data.file)
    this.step1(fileList)
  }

  createFileList(file: File) {
    const dt = new DataTransfer()
    dt.items.add(file)
    const fileList = dt.files
    return fileList
  }

  ngOnDestroy() {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  close = () => {
    this._dialogRef.close()
  }
}
