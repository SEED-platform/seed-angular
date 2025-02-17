import { HttpClient, type HttpErrorResponse } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { catchError, map, type Observable, Subject, switchMap, tap } from 'rxjs'
import { ErrorService } from '@seed/services/error/error.service'
import { SnackbarService } from 'app/core/snackbar/snackbar.service'
import { OrganizationService } from '../organization'
import type { DerivedColumn, DerivedColumnResponse } from './derived-column.types'

@Injectable({ providedIn: 'root' })
export class DerivedColumnService {
  private _httpClient = inject(HttpClient)
  private _organizationService = inject(OrganizationService)
  private _snackBar = inject(SnackbarService)
  private _errorService = inject(ErrorService)
  private _derivedColumns = new Subject<DerivedColumn[]>()
  orgId: number

  derivedColumns$ = this._derivedColumns.asObservable()

  get(inventory_type: string): Observable<DerivedColumn[]> {
    return this._organizationService.currentOrganization$
      .pipe(
        switchMap(({ org_id }) => {
          const url = `/api/v3/derived_columns/?organization_id=${org_id}&inventory_type=${inventory_type}`
          return this._httpClient.get<DerivedColumnResponse>(url)
            .pipe(
              map(({ derived_columns }) => derived_columns),
              tap((derived_columns) => { this._derivedColumns.next(derived_columns) }),
              catchError((error: HttpErrorResponse) => {
                return this._errorService.handleError(error, 'Error fetching derived columns')
              }),
            )
        }),
      )
  }

  post(derivedColumn: DerivedColumn, orgId: number) {
    const url = `/api/v3/derived_columns/?organization_id=${orgId}`
    return this._httpClient.post<DerivedColumn>(url, derivedColumn)
      .pipe(
        tap(() => { this._snackBar.success('Derived column created') }),
        catchError((error: HttpErrorResponse) => {
          return this._errorService.handleError(error, 'Error creating derived column')
        }),
      )
  }

  // rp this is copied from post
  put(derivedColumn: DerivedColumn, orgId: number) {
    const url = `/api/v3/derived_columns/?organization_id=${orgId}`
    return this._httpClient.post<DerivedColumn>(url, derivedColumn)
      .pipe(
        tap(() => { this._snackBar.success('Derived column created') }),
        catchError((error: HttpErrorResponse) => {
          return this._errorService.handleError(error, 'Error creating derived column')
        }),
      )
  }

  delete(id: number, orgId: number) {
    const url = `/api/v3/derived_columns/${id}/?organization_id=${orgId}`
    return this._httpClient.delete(url)
      .pipe(
        tap(() => { this._snackBar.success('Derived column deleted') }),
        catchError((error: HttpErrorResponse) => {
          return this._errorService.handleError(error, 'Error deleting derived column')
        }),
      )
  }
}
