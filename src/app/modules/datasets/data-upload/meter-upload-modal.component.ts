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
import type { ProgressBarObj } from '@seed/services/uploader/uploader.types'
import { AgGridAngular } from 'ag-grid-angular'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import { Subject } from 'rxjs'

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
  progressBarObj: ProgressBarObj = this._uploaderService.defaultProgressBarObj

  data = inject(MAT_DIALOG_DATA) as { datasetId: string; orgId: number }

  ngAfterViewInit() {
    console.log('init')
  }

  ngOnDestroy() {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  close = () => {
    this._dialogRef.close()
  }
}
