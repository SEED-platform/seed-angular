import { DecimalPipe } from '@angular/common'
import { HttpEventType } from '@angular/common/http'
import type { OnDestroy } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { TranslocoDirective } from '@jsverse/transloco'
import { filter, last, Subject, switchMap, takeUntil, tap } from 'rxjs'
import { OrganizationService } from '@seed/api/organization'
import { ProgressService } from '@seed/api/progress'
import { AlertComponent } from '../../../../../@seed/components'
import type { UploadInstancesData } from '../access-level-tree.types'

@Component({
  selector: 'seed-upload-instances-dialog',
  templateUrl: './upload-instances-dialog.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrl: './upload-instances-dialog.component.scss',
  imports: [
    AlertComponent,
    DecimalPipe,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    TranslocoDirective,
  ],
})
export class UploadInstancesDialogComponent implements OnDestroy {
  private _data = inject(MAT_DIALOG_DATA) as UploadInstancesData
  private _dialogRef = inject(MatDialogRef<UploadInstancesDialogComponent>)
  private _organizationService = inject(OrganizationService)
  private _progressService = inject(ProgressService)

  private readonly _unsubscribeAll$ = new Subject<void>()
  readonly allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  file?: File
  inProgress = false
  completed = false
  progress: { message: string; value: number }[] = []
  totalAccessLevelInstances: number
  errors: string[]

  upload(): void {
    if (this.inProgress || !this.file) {
      return
    }

    this.progress.unshift({ message: 'Uploading', value: 0 })
    this.inProgress = true

    this._organizationService
      .uploadAccessLevelInstances(this._data.organizationId, this.file)
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap((event) => {
          // Handle upload progress updates
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.progress[0].value = Math.round((event.loaded / event.total) * 100)
          }
        }),
        // Only proceed to the next step when the upload is complete
        filter((event) => event.type === HttpEventType.Response),
        switchMap((response) => {
          // Setup next progress message and initiate the saving process
          this.progress.unshift({ message: 'Saving access levels', value: 0 })
          return this._organizationService.startSavingAccessLevelInstances(this._data.organizationId, response.body.tempfile)
        }),
        switchMap((progress) => {
          return this._progressService.checkProgressLoop$(progress.progress_key).pipe(
            tap((progress) => {
              this.progress[0].value = progress.progress
            }),
            last(),
          )
        }),
      )
      .subscribe({
        next: (progressResult) => {
          this.totalAccessLevelInstances = progressResult.total
          if (progressResult.status === 'error' && typeof progressResult.message === 'string') {
            // Handle unexpected error
            this.errors = [progressResult.message]
          } else if (progressResult.message && typeof progressResult.message === 'object') {
            // Handle expected errors
            const errors = progressResult.message as Record<string, { message: string }>
            this.errors = Object.entries(errors).map(([key, { message }]) => `${key} - ${message}`)
          }
        },
        error: (error) => {
          this.errors = [(error as Error).message]
        },
      })
      .add(() => {
        this.inProgress = false
        this.completed = true
        // Refresh tree
        this._organizationService.getAccessLevelTree(this._data.organizationId).subscribe()
      })
  }

  selectFile(fileList: FileList): Promise<void> {
    if (fileList.length === 0) {
      return
    }

    const [file] = fileList

    if (!this.allowedTypes.includes(file.type)) {
      return
    }

    this.file = file
  }

  isExcelFile() {
    return /\.xlsx?$/.test(this.file?.name)
  }

  close() {
    this._dialogRef.close()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
