import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { catchError, delay, EMPTY, expand, of, takeWhile, tap, throwError } from 'rxjs'
import type { ProgressBarObj, UploaderResponse } from './uploader.types'

@Injectable({ providedIn: 'root' })
export class UploaderService {
  private _httpClient = inject(HttpClient)

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
  }: {
    progressKey: string;
    offset: number;
    multiplier: number;
    successFn: () => void;
    failureFn: () => void;
    progressBarObj: ProgressBarObj;
  }): Observable<UploaderResponse> {
    return this.checkProgress(progressKey).pipe(
      tap((response) => {
        this._updateProgressBarObj({ data: response, offset, multiplier, progressBarObj })
      }),
      // recursive call to checkProgressLoop after a short delay
      expand((response) => {
        if (response.progress < 100) {
          return this.checkProgressLoop({ progressKey, offset, multiplier, successFn, failureFn, progressBarObj })
            .pipe(delay(750))
        }
        successFn()
        return EMPTY
      }),
      // end stream if complete
      takeWhile((response) => response.progress < 100),
      catchError(() => {
        failureFn()
        return throwError(() => new Error('Progress check failed'))
      }),
    )
  }

  /*
  Fetches progress for a given progress key
  */
  checkProgress(progressKey: string): Observable<UploaderResponse> {
    const url = `/api/v3/progress/${progressKey}/`
    return this._httpClient
      .get<UploaderResponse>(url)
      .pipe(
        catchError((error) => {
          console.error('Error fetching progress:', error)
          return of(null)
        }),
      )
  }

  /*
  * Updates the progress bar object with incoming progress data.
  */
  _updateProgressBarObj({ data, offset, multiplier, progressBarObj }: {
    data: UploaderResponse;
    offset: number; multiplier: number;
    progressBarObj: ProgressBarObj;
  }): void {
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
