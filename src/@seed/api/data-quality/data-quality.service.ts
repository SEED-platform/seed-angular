import { HttpClient, type HttpErrorResponse } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { catchError, type Observable, of, Subject, switchMap, tap } from 'rxjs'
import { OrganizationService } from '@seed/api/organization'
import { ErrorService } from '@seed/services'
import { SnackbarService } from 'app/core/snackbar/snackbar.service'
import type { Rule } from './data-quality.types'

@Injectable({ providedIn: 'root' })
export class DataQualityService {
  private _httpClient = inject(HttpClient)
  private _organizationService = inject(OrganizationService)
  private _snackBar = inject(SnackbarService)
  private _errorService = inject(ErrorService)
  private _rules = new Subject<Rule[]>()
  orgId: number
  rules$ = this._rules.asObservable()

  getRules(): Observable<Rule[]> {
    return this._organizationService.currentOrganization$
      .pipe(
        switchMap(({ org_id }) => {
          const url = `/api/v3/data_quality_checks/${org_id}/rules/`
          return this._httpClient.get<Rule[]>(url)
            .pipe(
              tap((dataQualityRules) => { this._rules.next(dataQualityRules) }),
              catchError((error: HttpErrorResponse) => {
                return this._errorService.handleError(error, 'Error fetching data quality rules')
              }),
            )
        }),
      )
  }

  putRule({ orgId, id, rule }): Observable<unknown> {
    const url = `/api/v3/data_quality_checks/${orgId}/rules/${id}/`
    return this._httpClient.put<Rule>(url, rule)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return this._errorService.handleError(error, 'Error updating data quality rule')
        }),
      )
  }

  postRule({ orgId, rule }): Observable<unknown> {
    console.log('post', orgId, rule)
    return of([])
  }
}
