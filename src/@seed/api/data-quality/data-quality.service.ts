import { HttpClient, type HttpErrorResponse } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { catchError, type Observable, ReplaySubject, Subject, switchMap, takeUntil, tap } from 'rxjs'
import { OrganizationService } from '@seed/api/organization'
import { ErrorService } from '@seed/services'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import type { Rule } from './data-quality.types'

@Injectable({ providedIn: 'root' })
export class DataQualityService {
  private _httpClient = inject(HttpClient)
  private _organizationService = inject(OrganizationService)
  private _snackBar = inject(SnackBarService)
  private _errorService = inject(ErrorService)
  private _rules = new ReplaySubject<Rule[]>()
  private readonly _unsubscribeAll$ = new Subject<void>()
  orgId: number
  rules$ = this._rules.asObservable()

  constructor() {
    this._organizationService.currentOrganization$
      .pipe(
        takeUntil(this._unsubscribeAll$),
        switchMap(({ org_id }) => this.getRules(org_id)),
      )
      .subscribe()
  }

  getRules(orgId: number): Observable<Rule[]> {
    const url = `/api/v3/data_quality_checks/${orgId}/rules/`
    return this._httpClient.get<Rule[]>(url).pipe(
      tap((dataQualityRules) => {
        this._rules.next(dataQualityRules)
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching data quality rules')
      }),
    )
  }

  putRule({ orgId, id, rule }): Observable<unknown> {
    const url = `/api/v3/data_quality_checks/${orgId}/rules/${id}/`
    return this._httpClient.put<Rule>(url, rule).pipe(
      tap(() => {
        this._snackBar.success('Data quality rule updated')
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error updating data quality rule')
      }),
    )
  }

  postRule({ orgId, rule }): Observable<unknown> {
    const url = `/api/v3/data_quality_checks/${orgId}/rules/`
    return this._httpClient.post<Rule>(url, rule).pipe(
      tap(() => {
        this._snackBar.success('Data quality rule created')
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error creating data quality rule')
      }),
    )
  }

  deleteRule({ orgId, id }): Observable<unknown> {
    const url = `/api/v3/data_quality_checks/${orgId}/rules/${id}/`
    return this._httpClient.delete(url).pipe(
      tap(() => {
        this._snackBar.success('Rule deleted from organization')
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error deleting rule')
      }),
    )
  }

  resetRules(orgId: number): Observable<unknown> {
    const url = `/api/v3/data_quality_checks/${orgId}/rules/reset/`
    return this._httpClient.put(url, {}).pipe(
      tap(() => {
        this._snackBar.success('Data quality rules reset')
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error resetting data quality rules')
      }),
    )
  }
}
