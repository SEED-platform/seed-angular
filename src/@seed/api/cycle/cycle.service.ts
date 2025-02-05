import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { BehaviorSubject, catchError, map, of } from 'rxjs'
import { OrganizationService } from '@seed/api/organization'
import type { Cycle, ListCyclesResponse } from './cycle.types'

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
        .get<ListCyclesResponse>(url)
        .pipe(
          map((response) => response.cycles),
          catchError((error) => { 
            console.error('Error fetching cycles:', error)
            return of([])
          })
        )
        .subscribe((cycles) => {
          this._cycles.next(cycles)
        })
    })
  }

  post(data: Cycle, orgId: number): void {
    // create a cycle
    console.log('post', data)
    const url = `/api/v3/cycles/?organization_id=${orgId}`
    this._httpClient
      .post<Cycle>(url, data)
      .pipe(
        map((response) => response),
        catchError((error) => {
          console.error('Error creating cycle:', error)
          return of(null)
        })
      )
      .subscribe((response) => {
        console.log(response)
      })
  }
}
