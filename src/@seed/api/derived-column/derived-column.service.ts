import { HttpClient, type HttpErrorResponse } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { catchError, Subject, switchMap, tap } from 'rxjs'
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

  get(inventory_type: string): void {
    this._organizationService.currentOrganization$
      .pipe(
        tap(({ org_id }) => { this.orgId = org_id }),
        switchMap(({ org_id }) => {
          const url = `/api/v3/derived_columns/?organization_id=${org_id}&inventory_type=${inventory_type}`
          return this._httpClient.get<DerivedColumnResponse>(url)
            .pipe(
              tap(({ derived_columns }) => { this._derivedColumns.next(derived_columns) }),
              catchError((error: HttpErrorResponse) => {
                return this._errorService.handleError(error, 'Error fetching derived columns')
              }),
            )
        }),
      )
      .subscribe()
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


    // }) => $http({
    //   url: '/api/v3/derived_columns/',
    //   method: 'POST',
    //   params: { organization_id },
    //   data: {
    //     name,
    //     expression,
    //     inventory_type,
    //     parameters
    //   }
    // }).then((response) => response.data);