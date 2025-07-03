import { StepperSelectionEvent } from '@angular/cdk/stepper'
import { CommonModule } from '@angular/common'
import { HttpErrorResponse } from '@angular/common/http'
import type { AfterViewInit, ElementRef, OnDestroy, OnInit } from '@angular/core'
import { Component, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatSelectModule } from '@angular/material/select'
import { MatStepper, MatStepperModule } from '@angular/material/stepper'
import { Router, RouterModule } from '@angular/router'
import { Cycle } from '@seed/api/cycle'
import { CycleService } from '@seed/api/cycle/cycle.service'
import type { Dataset } from '@seed/api/dataset'
import { DatasetService } from '@seed/api/dataset'
import { ProgressResponse } from '@seed/api/progress'
import { ProgressBarComponent } from '@seed/components'
import { ErrorService } from '@seed/services'
import { ProgressBarObj, UploaderService } from '@seed/services/uploader'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import { catchError, Subject, switchMap, takeUntil, tap } from 'rxjs'

@Component({
  selector: 'seed-property-taxlot-upload',
  templateUrl: './property-taxlot-upload.component.html',
  imports: [
    CommonModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatStepperModule,
    ProgressBarComponent,
    ReactiveFormsModule,
    RouterModule,
  ],
})
export class PropertyTaxlotUploadComponent implements AfterViewInit, OnDestroy {
  @ViewChild('stepper') stepper!: MatStepper
  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>
  @Input() cycles: Cycle[]
  @Input() dataset: Dataset
  @Input() orgId: number
  @Output() dismissModal = new EventEmitter<null>()
  private _datasetService = inject(DatasetService)
  private _cycleService = inject(CycleService)
  private _uploaderService = inject(UploaderService)
  private _errorService = inject(ErrorService)
  private _router = inject(Router)
  private _snackBar = inject(SnackBarService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  allowedTypes: string
  completed = { 1: false, 2: false, 3: false }
  file: File
  fileId: number
  inProgress = false
  uploading = false
  progressBarObj: ProgressBarObj = {
    message: [],
    progress: 0,
    total: 100,
    complete: false,
    statusMessage: '',
    progressLastUpdated: null,
    progressLastChecked: null,
  }
  sourceType: 'Assessed Raw' | 'GeoJSON' | 'BuildingSync Raw'

  form = new FormGroup({
    cycleId: new FormControl<number>(null, Validators.required),
    multiCycle: new FormControl<boolean>(false),
  })
  
  ngAfterViewInit() {
    this.form.patchValue({ cycleId: this.cycles[0]?.id })
  }

  step1(fileList: FileList) {
    this.file = fileList?.[0]
    const cycleId = this.form.get('cycleId')?.value
    const multiCycle = this.form.get('multiCycle')?.value
    this.uploading = true

    return this._uploaderService
      .fileUpload(this.orgId, this.file, this.sourceType, this.dataset.id.toString())
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(({ import_file_id }) => {
          this.fileId = import_file_id
          this.completed[1] = true
        }),
        switchMap(() => this._uploaderService.saveRawData(this.orgId, cycleId, this.fileId, multiCycle)),
        tap(({ progress_key }: { progress_key: string }) => {
          this.uploading = false
          this.stepper.next()
          this.step2(progress_key)
        }),
        catchError((error: HttpErrorResponse) => {
          return this._errorService.handleError(error, 'Error uploading file')
        }),
      )
      .subscribe()
  }

  triggerUpload(sourceType: 'Assessed Raw' | 'GeoJSON' | 'BuildingSync Raw') {
    this.sourceType = sourceType
    const allowedMap = {
      'Assessed Raw': '.csv,.xls,.xlsx',
      GeoJSON: '.geojson,application/geo+json',
      'BuildingSync Raw': '.xml,application/xml,text/xml',
    }
    this.allowedTypes = allowedMap[sourceType]

    setTimeout(() => {
      this.fileInput.nativeElement.click()
    })
  }

  step2(progressKey: string) {
    this.inProgress = true

    const failureFn = () => {
      this._snackBar.alert('File Upload Failed')
    }

    const successFn = () => {
      this.completed[2] = true
      setTimeout(() => {
        this.stepper.next()
      })
    }

    this._uploaderService
      .checkProgressLoop({
        progressKey,
        offset: 0,
        multiplier: 1,
        failureFn,
        successFn,
        progressBarObj: this.progressBarObj,
      })
      .subscribe()
  }

  goToMapping() {
    this.dismissModal.emit()
    void this._router.navigate(['/data/mappings', this.fileId])
  }

  goToStep1() {
    this.completed[3] = true
    this.stepper.selectedIndex = 0
  }

  onStepChange(event: StepperSelectionEvent) {
    const index = event.selectedIndex
    if (index === 0) this.resetStepper()
  }

  resetStepper() {
    this.completed = { 1: false, 2: false, 3: false }
    this.file = null
    this.fileId = null
    this.fileInput.nativeElement.value = ''
    this.inProgress = false
    this.uploading = false
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
