import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { catchError, map, of, ReplaySubject, Subject, takeUntil } from 'rxjs'
import { UserService } from '../user'
import type { CountDatasetsResponse, Dataset, ListDatasetsResponse } from './dataset.types'

@Injectable({ providedIn: 'root' })
export class DatasetService {
  private _httpClient = inject(HttpClient)
  private _userService = inject(UserService)

  private readonly _unsubscribeAll$ = new Subject<void>()
  private _datasetCount = new ReplaySubject<number>(1)
  datasetCount$ = this._datasetCount.asObservable()

  constructor() {
    // Refresh dataset count only when the organization ID changes
    this._userService.currentOrganizationId$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((organizationId) => {
      this.countDatasets(organizationId).subscribe()
    })
  }

  listDatasets(organizationId: number): Observable<Dataset[]> {
    return this._httpClient
      .get<ListDatasetsResponse>(`/api/v3/datasets/?organization_id=${organizationId}`)
      .pipe(map(({ datasets }) => datasets))
  }

  countDatasets(organizationId: number): Observable<number> {
    return this._httpClient.get<CountDatasetsResponse>(`/api/v3/datasets/count/?organization_id=${organizationId}`).pipe(
      map(({ datasets_count }) => {
        // This assumes that the organizationId passed in is the selected organization
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
