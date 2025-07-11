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
import type { ProgressBarObj, ProposedMeterImport, ValidatedTypeUnit } from '@seed/services/uploader/uploader.types'
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
  completed = { 1: false, 2: false, 3: false, 4: false }
  inProgress = false
  incomingTitle: string
  uploading = false
  gridTheme$ = this._configService.gridTheme$
  progressBarObj: ProgressBarObj = this._uploaderService.defaultProgressBarObj
  proposedImports: ProposedMeterImport[] = []
  readingHeight = 0
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
  unitDefs: ColDef[] = [
    { field: 'parsed_type', headerName: 'Type', flex: 1 },
    { field: 'parsed_unit', headerName: 'Unit', flex: 1 },
  ]

  data = inject(MAT_DIALOG_DATA) as { datasetId: string; orgId: number }

  ngAfterViewInit() {
    console.log('init')
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
          this.setIncomingTitle(response)
          this.proposedImports = response.proposed_imports
          this.validatedTypeUnits = response.validated_type_units
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
    console.log('step3')
  }

  setIncomingTitle(response: { proposed_imports: ProposedMeterImport[] }) {
    const { proposed_imports } = response
    const meterCount = proposed_imports.length
    const propertyCount = new Set(proposed_imports.map((m) => m.pm_property_id)).size
    this.incomingTitle = `${meterCount > 1 ? `${meterCount} Meters` : '1 Meter'} from ${propertyCount > 1 ? `${propertyCount} Properties` : '1 Property'}`
  }

  csvDownload(title: 'proposed_meter_imports' | 'validated_type_units') {
    const data = title === 'proposed_meter_imports' ? this.proposedImports : this.validatedTypeUnits
    csvDownload(title, data)
  }

  ngOnDestroy() {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  close = () => {
    this._dialogRef.close()
  }
}
