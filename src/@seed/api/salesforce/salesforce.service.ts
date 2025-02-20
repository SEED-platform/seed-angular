import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { catchError, map, ReplaySubject, Subject, takeUntil } from 'rxjs'
import { ErrorService } from '@seed/services'
import { SnackbarService } from 'app/core/snackbar/snackbar.service'
import { UserService } from '../user'
import type {
  SalesforceConfig,
  SalesforceConfigsResponse,
  SalesforceMapping,
  SalesforceMappingsResponse,
} from './salesforce.types'

@Injectable({ providedIn: 'root' })
export class SalesforceService {
  private _httpClient = inject(HttpClient)
  private _userService = inject(UserService)
  private _config = new ReplaySubject<SalesforceConfig>(1)
  private _mappings = new ReplaySubject<SalesforceMapping[]>(1)
  private _errorService = inject(ErrorService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _snackBar = inject(SnackbarService)

  config$ = this._config.asObservable()
  mappings$ = this._mappings.asObservable()

  constructor() {
    // Fetch current org data whenever user org id changes
    this._userService.currentOrganizationId$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((organizationId) => {
      this.getConfig(organizationId).subscribe()
    })
  }

  getConfig(org_id: number): Observable<SalesforceConfigsResponse> {
    const url = `/api/v3/salesforce_configs/?organization_id=${org_id}`
    return this._httpClient.get<SalesforceConfigsResponse>(url).pipe(
      map((response) => {
        if (response.salesforce_configs.length == 0) {
          this._config.next({} as SalesforceConfig)
        } else {
          this._config.next(response.salesforce_configs[0])
        }
        return response
      }),
      catchError((error: HttpErrorResponse) => {
        // TODO need to figure out error handling
        return this._errorService.handleError(error, 'Error fetching organization')
      }),
    )
  }

  getMappings(org_id: number): Observable<SalesforceMappingsResponse> {
    const url = `/api/v3/salesforce_mappings/?organization_id=${org_id}`
    return this._httpClient.get<SalesforceMappingsResponse>(url).pipe(
      map((response) => {
        this._mappings.next(response.salesforce_mappings)
        return response
      }),
      catchError((error: HttpErrorResponse) => {
        // TODO need to figure out error handling
        return this._errorService.handleError(error, 'Error fetching organization')
      }),
    )
  }
}
