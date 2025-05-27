import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatSelectModule } from '@angular/material/select'
import { type Observable, Subject, switchMap, takeUntil, tap } from 'rxjs'
import { type Column, ColumnService } from '@seed/api/column'
import { type Organization } from '@seed/api/organization'
import type { ProgressResponse } from '@seed/api/progress'
import { SharedImports } from '@seed/directives'
import { UploaderService } from '@seed/services/uploader/uploader.service'
import type { ProgressBarObj } from '@seed/services/uploader/uploader.types'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'

@Component({
  selector: 'seed-labels-form-modal',
  templateUrl: './form-modal.component.html',
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    FormsModule,
    MatInputModule,
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule,
    ReactiveFormsModule,
    SharedImports,
  ],
})
export class FormModalComponent implements OnDestroy, OnInit {
  private _dialogRef = inject(MatDialogRef<FormModalComponent>)
  private _columnService = inject(ColumnService)
  private _snackBar = inject(SnackBarService)
  private _uploaderService = inject(UploaderService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  column: Column
  organization: Organization
  refreshFn: (organization_id: number) => Observable<Column[]>
  data = inject(MAT_DIALOG_DATA) as { column: Column; organization: Organization }
  inProgress = false
  progressBarObj: ProgressBarObj = {
    message: '',
    progress: 0,
    complete: false,
    statusMessage: '',
    progressLastUpdated: null,
    progressLastChecked: null,
  }
  form = new FormGroup({
    display_name: new FormControl<string | null>('', [Validators.required]),
    column_description: new FormControl<string | null>(null, [Validators.required]),
    organization_id: new FormControl<number | null>(null, [Validators.required]),
    table_name: new FormControl<string | null>('', [Validators.required]),
    comstock_mapping: new FormControl<string | null>(null),
    id: new FormControl<number | null>(null),
  })

  ngOnInit(): void {
    this.form.patchValue(this.data.column)
    if (this.data.column.table_name === 'PropertyState') {
      this.refreshFn = (org_id) => this._columnService.getPropertyColumns(org_id)
    } else if (this.data.column.table_name === 'TaxLotState') {
      this.refreshFn = (org_id) => this._columnService.getTaxLotColumns(org_id)
    }
  }

  onSubmit() {
    const successFn = () => {
      setTimeout(() => {
        this.refreshFn(this.data.column.organization_id).subscribe()
        this._snackBar.success('Column Updated')
        this.close()
      }, 300)
    }
    const failureFn = () => {
      this._snackBar.alert('Failed to update column')
      this.close()
    }
    const c = this.form.value as Column
    const changes = {}
    this.inProgress = true
    changes[`${c.id}`] = { display_name: c.display_name, column_description: c.column_description, comstock_mapping: c.comstock_mapping }
    this._columnService
      .updateMultipleColumns(c.organization_id, c.table_name, changes)
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap((response: ProgressResponse) => {
          this.progressBarObj.progress = response.progress
        }),
        switchMap(({ progress_key }) => {
          return this._uploaderService.checkProgressLoop({
            progressKey: progress_key,
            offset: 0,
            multiplier: 1,
            successFn,
            failureFn,
            progressBarObj: this.progressBarObj,
          })
        }),
      )
      .subscribe()
  }

  close() {
    this._dialogRef.close()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
