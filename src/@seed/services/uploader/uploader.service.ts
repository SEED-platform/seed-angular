import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { catchError, interval, of, switchMap, takeWhile, tap, throwError } from 'rxjs'
import type { ProgressResponse } from '@seed/api/progress'
import { ErrorService } from '../error'
import type { CheckProgressLoopParams, SensorPreviewResponse, UpdateProgressBarObjParams, UploadResponse } from './uploader.types'

@Injectable({ providedIn: 'root' })
export class UploaderService {
  private _httpClient = inject(HttpClient)
  private _errorService = inject(ErrorService)

  /*
   * Checks a progress key for updates until it completes
   */
  checkProgressLoop({
    progressKey,
    offset,
    multiplier,
    successFn,
    failureFn,
    progressBarObj,
  }: CheckProgressLoopParams): Observable<ProgressResponse> {
    const isCompleted = (status: string) => ['error', 'success', 'warning'].includes(status)

    return interval(750).pipe(
      switchMap(() => this.checkProgress(progressKey)),
      tap((response) => { this._updateProgressBarObj({ data: response, offset, multiplier, progressBarObj }) }),
      takeWhile((response) => !isCompleted(response.status), true), // end stream
      tap((response) => { if (response.status === 'success') successFn() }),
      catchError(() => {
        // TODO the interval needs to continue if the error was network-related
        failureFn()
        return throwError(() => new Error('Progress check failed'))
      }),
    )
  }

  /*
   * Fetches progress for a given progress key
   */
  checkProgress(progressKey: string): Observable<ProgressResponse> {
    const url = `/api/v3/progress/${progressKey}/`
    return this._httpClient.get<ProgressResponse>(url).pipe(
      catchError((error) => {
        console.error('Error fetching progress:', error)
        return of(null)
      }),
    )
  }

  greenButtonMetersPreview(fileId: number, orgId: number, viewId: number, systemId: number): Observable<unknown> {
    const url = `/api/v3/import_files/${fileId}/greenbutton_meters_preview/`
    const params = { organization_id: orgId, view_id: viewId, system_id: systemId }
    return this._httpClient.get(url, { params }).pipe(
      tap((results) => {
        console.log('gb', results)
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching greenButton preview')
      }),
    )
  }

  fileUpload(orgId: number, file: File, sourceType: string, importRecordId: string): Observable<UploadResponse> {
    const url = `/api/v3/upload/?organization_id=${orgId}`
    const formData = new FormData()
    formData.append('file', file, file.name)
    formData.append('source_type', sourceType)
    formData.append('import_record', importRecordId)

    return this._httpClient.post<UploadResponse>(url, formData).pipe(
      tap(() => { console.log('File uploaded successfully') }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error uploading file')
      }),
    )
  }

  sensorPreview(orgId: number, viewId: number, dataLoggerId: number, fileId: number): Observable<SensorPreviewResponse> {
    const url = `/api/v3/import_files/${fileId}/sensors_preview/`
    const params = { organization_id: orgId, view_id: viewId, data_logger_id: dataLoggerId }
    return this._httpClient.get <SensorPreviewResponse>(url, { params }).pipe(
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching sensor preview')
      }),
    )
  }

  saveRawData(orgId: number, cycleId: number, fileId: number, multipleCycleUpload = false): Observable<unknown> {
    const url = `/api/v3/import_files/${fileId}/start_save_data/?organization_id=${orgId}`
    const body = { cycle_id: cycleId, multiple_cycle_upload: multipleCycleUpload }
    return this._httpClient.post(url, body).pipe(
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error saving raw data')
      }),
    )
  }

  /*
   * Updates the progress bar object with incoming progress data.
   */
  private _updateProgressBarObj({ data, offset, multiplier, progressBarObj }: UpdateProgressBarObjParams): void {
    const rightNow = Date.now()
    progressBarObj.progressLastChecked = rightNow

    const newProgressValue = Math.min(Math.max(data.progress * multiplier + offset, 0), 100)
    const updatingProgress = newProgressValue !== progressBarObj.progress || progressBarObj.statusMessage !== data.status_message
    if (updatingProgress) {
      progressBarObj.progressLastUpdated = rightNow
    }

    if (data.total_records) {
      progressBarObj.totalRecords = data.total_records
    }
    if (data.completed_records) {
      progressBarObj.completedRecords = data.completed_records
    }
    progressBarObj.progress = newProgressValue
    progressBarObj.statusMessage = data.status_message
    progressBarObj.message = data.message
  }
}
