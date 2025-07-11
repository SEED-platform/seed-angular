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
import { ModalHeaderComponent, ProgressBarComponent } from '@seed/components'
import { ConfigService } from '@seed/services'
import { UploaderService } from '@seed/services/uploader/uploader.service'
import type { ProgressBarObj, ProposedMeterImport } from '@seed/services/uploader/uploader.types'
import { AgGridAngular } from 'ag-grid-angular'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import { Subject, switchMap, takeUntil, tap } from 'rxjs'

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
  uploading = false
  gridTheme$ = this._configService.gridTheme$
  gridHeight = 0
  progressBarObj: ProgressBarObj = this._uploaderService.defaultProgressBarObj
  proposedImports: ProposedMeterImport[] = []

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
        tap((response) => { console.log(response)}),
        tap(({ import_file_id }) => {
          this.fileId = import_file_id
          this.completed[1] = true
        }),
        switchMap(() => this._uploaderService.metersPreview(orgId, this.fileId)),
        tap(({ proposed_imports }) => {
          this.proposedImports = proposed_imports
          this.gridHeight = Math.min(this.proposedImports.length * 35 + 42, 300)
          this.stepper.next()
          this.validateImports()
          this.uploading = false
        }),
      )
      .subscribe()
  }

  validateImports() {
    console.log('task: Validate imports...')
    // this.validFile = this.proposedImports.every((item) => item?.column_name)
    // this.completed[2] = this.validFile
    // if (!this.validFile) {
    //   this._snackBar.alert('Invalid file format.')
    // }
  }


  ngOnDestroy() {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  close = () => {
    this._dialogRef.close()
  }
}
