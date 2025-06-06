import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { catchError, finalize, interval, of, switchMap, takeWhile, tap, throwError } from 'rxjs'
import type { ProgressResponse } from '@seed/api/progress'
import type { CheckProgressLoopParams, UpdateProgressBarObjParams } from './uploader.types'
import { ErrorService } from '../error'

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
    return interval(750).pipe(
      // poll every 750ms
      switchMap(() => this.checkProgress(progressKey)), // check progress each poll period
      tap((response) => {
        this._updateProgressBarObj({ data: response, offset, multiplier, progressBarObj })
      }),
      takeWhile((response) => response.progress < 100, true), // end stream
      finalize(() => {
        // TODO Since this is in finalize, on error successFn is called after failureFn
        successFn()
      }),
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
  }
}
