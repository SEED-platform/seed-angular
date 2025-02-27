import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { type Observable, Subject, switchMap } from 'rxjs'
import { BehaviorSubject, catchError, map, takeUntil, tap } from 'rxjs'
import { OrganizationService } from '@seed/api/organization'
import { ErrorService } from '@seed/services'
import { SnackbarService } from 'app/core/snackbar/snackbar.service'
import type { Cycle, CycleResponse, CyclesResponse } from './cycle.types'

@Injectable({ providedIn: 'root' })
export class CycleService {
  private _httpClient = inject(HttpClient)
  private _organizationService = inject(OrganizationService)
  private _snackBar = inject(SnackbarService)
  private _errorService = inject(ErrorService)
  private _cycles = new BehaviorSubject<Cycle[]>([])
  private readonly _unsubscribeAll$ = new Subject<void>()
  orgId: number

  cycles$ = this._cycles.asObservable()

  constructor() {
    this._organizationService.currentOrganization$
      .pipe(
        takeUntil(this._unsubscribeAll$),
        switchMap(({ org_id }) => this.get(org_id)),
      ).subscribe()
  }

  get(orgId: number): Observable<Cycle[]> {
    const url = `/api/v3/cycles/?organization_id=${orgId}`
    return this._httpClient.get<CyclesResponse>(url).pipe(
      map(({ cycles }) => cycles),
      tap((cycles) => {
        this._cycles.next(cycles)
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching cycles')
      }),
    )
  }

  post({ data, orgId }): Observable<CycleResponse | null> {
    const url = `/api/v3/cycles/?organization_id=${orgId}`
    return this._httpClient.post<CycleResponse>(url, data).pipe(
      tap((response) => {
        this._snackBar.success(`Created Cycle ${response.cycles.name}`)
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error creating cycle')
      }),
    )
  }

  put({ data, id, orgId }): Observable<CycleResponse | null> {
    const url = `/api/v3/cycles/${id}/?organization_id=${orgId}`
    return this._httpClient.put<CycleResponse>(url, data).pipe(
      tap((response) => {
        this._snackBar.success(`Updated Cycle ${response.cycles.name}`)
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error updating cycle')
      }),
    )
  }

  delete(id: number, orgId: number) {
    const url = `/api/v3/cycles/${id}/?organization_id=${orgId}`
    return this._httpClient.delete(url).pipe(
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error deleting cycle')
      }),
    )
  }
}
