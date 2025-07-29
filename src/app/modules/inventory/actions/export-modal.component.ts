import type { OnDestroy } from '@angular/core'
import { Component, inject, ViewChild } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import type { MatStepper } from '@angular/material/stepper'
import { catchError, combineLatest, EMPTY, finalize, Subject, switchMap, takeUntil, tap } from 'rxjs'
import { InventoryService } from '@seed/api'
import { ModalHeaderComponent, ProgressBarComponent } from '@seed/components'
import { MaterialImports } from '@seed/materials'
import { UploaderService } from '@seed/services'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import type { InventoryExportData, InventoryType } from '../inventory.types'

@Component({
  selector: 'seed-export-modal',
  templateUrl: './export-modal.component.html',
  imports: [FormsModule, MaterialImports, ModalHeaderComponent, ProgressBarComponent, ReactiveFormsModule],
})
export class ExportModalComponent implements OnDestroy {
  @ViewChild('stepper') stepper!: MatStepper
  private _dialogRef = inject(MatDialogRef<ExportModalComponent>)
  private _inventoryService = inject(InventoryService)
  private _snackBar = inject(SnackBarService)
  private _uploaderService = inject(UploaderService)
  private readonly _unsubscribeAll$ = new Subject<void>()

  progressBarObj = this._uploaderService.defaultProgressBarObj
  filename: string
  exportData: InventoryExportData

  data = inject(MAT_DIALOG_DATA) as {
    orgId: number;
    type: InventoryType;
    viewIds: number[];
    profileId: number;
  }

  form = new FormGroup({
    name: new FormControl<string>(null, Validators.required),
    include_notes: new FormControl(true),
    export_type: new FormControl<'csv' | 'xlsx' | 'geojson'>('csv', Validators.required),
    include_label_header: new FormControl(false),
    include_meter_readings: new FormControl(false),
  })

  export() {
    this._inventoryService.startInventoryExport(this.data.orgId)
      .pipe(
        tap(({ progress_key }) => { this.initExport(progress_key) }),
        switchMap(() => this.pollExport()),
        tap((response) => { this.downloadData(response[0]) }),
        takeUntil(this._unsubscribeAll$),
        catchError(() => { return EMPTY }),
        finalize(() => { this.close() }),
      )
      .subscribe()
  }

  initExport(progress_key: string) {
    this.stepper.next()
    this.formatFilename()
    this.formatExportData(this.filename, progress_key)
  }

  pollExport() {
    const { orgId, type } = this.data
    return combineLatest([
      this._inventoryService.exportInventory(orgId, type, this.exportData),
      this._uploaderService.checkProgressLoop({
        progressKey: this.exportData.progress_key,
        progressBarObj: this.progressBarObj,
      }),
    ])
  }

  downloadData(data: Blob) {
    const a = document.createElement('a')
    const url = URL.createObjectURL(data)
    a.href = url
    a.download = this.exportData.filename
    a.click()
    URL.revokeObjectURL(url)
    this._snackBar.success(`Exported ${this.exportData.filename}`)
  }

  formatFilename() {
    this.filename = this.form.value.name
    const ext = `.${this.form.value.export_type}`
    if (!this.filename.endsWith(ext)) {
      this.filename += ext
    }
  }

  formatExportData(filename: string, progress_key: string) {
    this.exportData = {
      export_type: this.form.value.export_type,
      filename,
      ids: this.data.viewIds,
      include_meter_readings: this.form.value.include_meter_readings,
      include_notes: this.form.value.include_notes,
      profile_id: this.data.profileId,
      progress_key,
    }
  }

  close() {
    this._dialogRef.close()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
