import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { BehaviorSubject, catchError, map, of, throwError } from 'rxjs'
import { OrganizationService } from '@seed/api/organization'
import type { Cycle, CycleResponse, CyclesResponse } from './cycle.types'

@Injectable({ providedIn: 'root' })
export class CycleService {
  private _httpClient = inject(HttpClient)
  private _organizationService = inject(OrganizationService)
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
          catchError((error) => {
            console.error('Error fetching cycles:', error)
            return of([])
          }),
        )
        .subscribe((cycles) => {
          this._cycles.next(cycles)
        })
    })
  }

  post({ data, orgId }): Observable<CycleResponse | null> {
    // create a cycle
    const url = `/api/v3/cycles/?organization_id=${orgId}`
    return this._httpClient.post<CycleResponse>(url, data).pipe(
      catchError(({ error }: { error: HttpErrorResponse }) => {
        console.error('Error creating cycle:', error)
        return throwError(() => new Error(error?.message || 'Error creating cycle'))
      }),
    )
  }

  put({ data, id, orgId }): Observable<CycleResponse | null> {
    const url = `/api/v3/cycles/${id}/?organization_id=${orgId}`
    return this._httpClient.put<CycleResponse>(url, data).pipe(
      catchError(({ error }: { error: HttpErrorResponse }) => {
        console.error('Error updating cycle:', error)
        return throwError(() => new Error(error?.message || 'Error updating cycle'))
      }),
    )
  }

  delete(id: number, orgId: number) {
    const url = `/api/v3/cycles/${id}/?organization_id=${orgId}`
    return this._httpClient.delete(url).pipe(
      catchError(({ error }: { error: HttpErrorResponse }) => {
        console.error('Error deleting cycle:', error)
        return throwError(() => new Error(error?.message || 'Error deleting cycle'))
      }),
    )
  }
}
