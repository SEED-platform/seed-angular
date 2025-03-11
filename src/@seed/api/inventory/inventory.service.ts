import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient, HttpParams } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { OrganizationService } from '@seed/api/organization'
import { ErrorService } from '@seed/services'
import { SnackbarService } from 'app/core/snackbar/snackbar.service'
import type { Observable } from 'rxjs'
import { BehaviorSubject, catchError, map, of, Subject, switchMap, takeUntil, tap } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private _httpClient = inject(HttpClient)
  private _organizationService = inject(OrganizationService)
  private _snackBar = inject(SnackbarService)
  private _errorService = inject(ErrorService)
  private _properties = new BehaviorSubject<unknown>([])
  private readonly _unsubscribeAll$ = new Subject<void>()
  orgId: number

  properties$ = this._properties.asObservable()

  constructor() {
    this._organizationService.currentOrganization$
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(({ org_id }) => { console.log(org_id) }),
      )
      .subscribe()
  }

  getProperties(params: Record<string, string | number>, data): Observable<unknown> {
    const queryParams = new HttpParams({ fromObject: params })
    // const { cycle, ids_only, include_related, organization_id, page, per_page } = params
    const url = 'api/v3/properties/filter'
    return this._httpClient.post(url, data, { params: queryParams }).pipe(
      map((response) => response),
      tap((response) => {
        this._properties.next(response)
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching properties')
      }),
    )
    return of([])
  }

  // get(orgId: number): Observable<Cycle[]> {
  //   const url = `/api/v3/cycles/?organization_id=${orgId}`
  //   return this._httpClient.get<CyclesResponse>(url).pipe(
  //     map(({ cycles }) => cycles),
  //     tap((cycles) => {
  //       this._cycles.next(cycles)
  //     }),
  //     catchError((error: HttpErrorResponse) => {
  //       return this._errorService.handleError(error, 'Error fetching cycles')
  //     }),
  //   )
  // }
}\