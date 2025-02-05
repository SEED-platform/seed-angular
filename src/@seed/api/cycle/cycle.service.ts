import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { BehaviorSubject, map } from 'rxjs'
import { OrganizationService } from '@seed/api/organization'
import type { Cycle, ListCyclesResponse } from './cycle.types'

@Injectable({ providedIn: 'root' })
export class CycleService {
  private _httpClient = inject(HttpClient)
  private _organizationService = inject(OrganizationService)
  private _cycles = new BehaviorSubject<Cycle[]>([])

  cycles$ = this._cycles.asObservable()

  get(): void {
    // fetch current organization
    this._organizationService.currentOrganization$.subscribe(({ org_id }) => {
      const url = `/api/v3/cycles/?organization_id=${org_id}`
      // fetch cycles
      this._httpClient
        .get<ListCyclesResponse>(url)
        .pipe(map((response) => response.cycles))
        .subscribe({
          next: (cycles) => {
            this._cycles.next(cycles)
          },
          error: (error) => {
            console.error('Error fetching cycles:', error)
          },
        })
    })
  }
}
