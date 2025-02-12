import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { BehaviorSubject, catchError, map, tap } from 'rxjs'
import { OrganizationService } from '@seed/api/organization'
import { ErrorService } from '@seed/services/error/error.service'
import { SnackbarService } from 'app/core/snackbar/snackbar.service'
import type { Cycle, CycleResponse, CyclesResponse } from './cycle.types'

@Injectable({ providedIn: 'root' })
export class CycleService {
  private _httpClient = inject(HttpClient)
  private _organizationService = inject(OrganizationService)
  private _snackBar = inject(SnackbarService)
  private _errorService = inject(ErrorService)
  private _cycles = new BehaviorSubject<Cycle[]>([])
  orgId: number

  cycles$ = this._cycles.asObservable()

  get(): void {
    // fetch current organization
    this._organizationService.currentOrganization$.subscribe(({ org_id }) => {
      this.orgId = org_id
      const url = `/api/v3/cycles/?organization_id=${org_id}`
      // fetch cycles
      this._httpClient
        .get<CyclesResponse>(url)
        .pipe(
          map((response) => response.cycles),
          tap((cycles) => {
            this._cycles.next(cycles)
          }),
          catchError((error: HttpErrorResponse) => {
            return this._errorService.handleError(error, 'Error fetching cycles')
          }),
        )
        .subscribe()
    })
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
        this._snackBar.success(`Updated Cycle ${response.cycles.name}`, 'OK', true)
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error updating cycle')
      }),
    )
  }

  delete(id: number, orgId: number) {
    const url = `/api/v3/cycles/${id}/?organization_id=${orgId}`
    return this._httpClient.delete(url).pipe(
      tap(() => {
        this._snackBar.success('Cycle deleted', 'OK', true)
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error deleting cycle')
      }),
    )
  }
}
