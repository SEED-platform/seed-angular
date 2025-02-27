import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { catchError, map, of, ReplaySubject, Subject, takeUntil } from 'rxjs'
import { ErrorService } from '@seed/services'
import { SnackbarService } from 'app/core/snackbar/snackbar.service'
import { UserService } from '../user'
import {
  type SalesforceConfig,
  type SalesforceConfigResponse,
  type SalesforceConfigsResponse,
  type SalesforceConnectionTestResponse,
  type SalesforceMapping,
  type SalesforceMappingsResponse,
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
      this.getMappings(organizationId).subscribe()
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

  create(org_id: number, config: SalesforceConfig): Observable<SalesforceConfig> {
    console.log('Creating: ', config)
    const url = `/api/v3/salesforce_configs/?organization_id=${org_id}`
    return this._httpClient.post<SalesforceConfigResponse>(url, { ...config }).pipe(
      map((response) => {
        this._config.next(response.salesforce_config)
        return response.salesforce_config
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching organization')
      }),
    )
  }

  update(org_id: number, config: SalesforceConfig, message?: string): Observable<SalesforceConfig> {
    const url = `/api/v3/salesforce_configs/${config.id}/?organization_id=${org_id}`
    return this._httpClient.put<SalesforceConfigResponse>(url, { ...config }).pipe(
      map((response) => {
        this._snackBar.success(message || 'Salesforce configuration updated')
        this._config.next(response.salesforce_config)
        return response.salesforce_config
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching organization')
      }),
    )
  }

  test_connection(org_id: number, config: SalesforceConfig): Observable<SalesforceConnectionTestResponse> {
    const url = `/api/v3/salesforce_configs/salesforce_connection/?organization_id=${org_id}`
    return this._httpClient.post<SalesforceConnectionTestResponse>(url, { salesforce_config: config }).pipe(
      map((response) => {
        this._snackBar.success('Salesforce Connection: Success')
        return response
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, `Salesforce Connection Error: ${error.message}`)
      }),
    )
  }
}
