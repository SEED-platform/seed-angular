import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { catchError, map, of, ReplaySubject, tap } from 'rxjs'
import type { CountDatasetsResponse, ListDatasetsResponse } from './dataset.types'

@Injectable({ providedIn: 'root' })
export class DatasetService {
  private _httpClient = inject(HttpClient)

  private _datasetCount: ReplaySubject<number> = new ReplaySubject<number>(1)
  datasetCount$ = this._datasetCount.asObservable()

  // TODO watch active org, on change request dataset count

  listDatasets(): Observable<ListDatasetsResponse> {
    return this._httpClient.get<ListDatasetsResponse>('/api/v3/datasets/').pipe(tap(({ datasets }) => datasets))
  }

  countDatasets(): Observable<number> {
    // TODO input dynamic org id
    return this._httpClient.get<CountDatasetsResponse>('/api/v3/datasets/count/?organization_id=1').pipe(
      map(({ datasets_count }) => {
        // TODO once this takes an organization_id, only update `this._datasetCount` IFF it's the active org
        this._datasetCount.next(datasets_count)
        return datasets_count
      }),
      catchError((error: HttpErrorResponse) => {
        // TODO toast or alert? also, better fallback value
        console.error('Error occurred while counting datasets:', error.error)
        return of(-1)
      }),
    )
  }
}
