import type { StepperSelectionEvent } from '@angular/cdk/stepper'
import { CommonModule } from '@angular/common'
import type { HttpErrorResponse } from '@angular/common/http'
import type { AfterViewInit, ElementRef, OnDestroy} from '@angular/core'
import { Component, inject, ViewChild } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatSelectModule } from '@angular/material/select'
import { type MatStepper, MatStepperModule } from '@angular/material/stepper'
import { Router, RouterModule } from '@angular/router'
import { catchError, Subject, switchMap, takeUntil, tap } from 'rxjs'
import type { Cycle } from '@seed/api/cycle'
import type { Dataset } from '@seed/api/dataset'
import type { OrganizationUserSettings } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import { UserService } from '@seed/api/user'
import { ModalHeaderComponent, ProgressBarComponent } from '@seed/components'
import { ErrorService } from '@seed/services'
import type { ProgressBarObj } from '@seed/services/uploader'
import { UploaderService } from '@seed/services/uploader'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'

@Component({
  selector: 'seed-data-upload-modal',
  templateUrl: './data-upload-modal.component.html',
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
    ModalHeaderComponent,
    ProgressBarComponent,
    ReactiveFormsModule,
    RouterModule,
  ],
})
export class DataUploadModalComponent implements AfterViewInit, OnDestroy {
  @ViewChild('stepper') stepper!: MatStepper
  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>

  private _dialogRef = inject(MatDialogRef<DataUploadModalComponent>)
  private _organizationService = inject(OrganizationService)
  private _uploaderService = inject(UploaderService)
  private _userService = inject(UserService)
  private _errorService = inject(ErrorService)
  private _router = inject(Router)
  private _snackBar = inject(SnackBarService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  allowedTypes: string
  completed = { 1: false, 2: false, 3: false }
  cycles: Cycle[]
  dataset: Dataset
  file: File
  fileId: number
  inProgress = false
  orgId: number
  orgUserId: number
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
  uploading = false
  userSettings: OrganizationUserSettings = {}

  data = inject(MAT_DIALOG_DATA) as { orgId: number; dataset: Dataset; cycles: Cycle[] }

  form = new FormGroup({
    cycleId: new FormControl<number>(null, Validators.required),
    multiCycle: new FormControl<boolean>(false),
  })

  ngAfterViewInit() {
    this.cycles = this.data.cycles
    this.dataset = this.data.dataset
    this.orgId = this.data.orgId

    this.form.patchValue({ cycleId: this.cycles[0]?.id })
    this._userService.currentUser$
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap((user) => {
          this.orgUserId = user.org_user_id
          this.userSettings = user.settings
        }),
      )
      .subscribe()
  }

  step1(fileList: FileList) {
    this.file = fileList?.[0]
    const cycleId = this.form.get('cycleId')?.value
    const multiCycle = this.form.get('multiCycle')?.value
    this.uploading = true
    this.userSettings.cycleId = cycleId
    this._organizationService.updateOrganizationUser(this.orgUserId, this.orgId, this.userSettings).subscribe()

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
    this.close()
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

  close = () => {
    this._dialogRef.close()
  }
}
