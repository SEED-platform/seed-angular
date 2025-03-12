import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { OrganizationService } from '@seed/api/organization'
import { ErrorService } from '@seed/services'
import { SnackbarService } from 'app/core/snackbar/snackbar.service'
import { FilterResponse, Inventory, Profile, ProfileResponse, ProfilesResponse } from 'app/modules/inventory/inventory.types'
import type { Observable } from 'rxjs'
import { BehaviorSubject, catchError, map, Subject, takeUntil, tap } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private _httpClient = inject(HttpClient)
  private _organizationService = inject(OrganizationService)
  private _snackBar = inject(SnackbarService)
  private _errorService = inject(ErrorService)
  private _properties = new BehaviorSubject<unknown>([])
  private _columnListProfiles = new BehaviorSubject<unknown>([])
  private readonly _unsubscribeAll$ = new Subject<void>()
  orgId: number

  properties$ = this._properties.asObservable()
  columnListProfiles$ = this._columnListProfiles.asObservable()

  constructor() {
    this._organizationService.currentOrganization$
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(({ org_id }) => {
          this.orgId = org_id
        }),
      )
      .subscribe()
  }

  getProperties(params: Record<string, string | number | boolean>, data: Record<string, unknown>): Observable<FilterResponse> {
    // const { cycle, ids_only, include_related, organization_id, page, per_page } = params
    const url = 'api/v3/properties/filter/'
    return this._httpClient.post<FilterResponse>(url, data, { params }).pipe(
      map((response) => response),
      tap((response) => {
        this._properties.next(response)
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching properties')
      }),
    )
  }

  getAgProperties(params: Record<string, string | number | boolean>, data: Record<string, unknown>): Observable<AgFilterResponse> {
    // const { cycle, ids_only, include_related, organization_id, page, per_page } = params
    const url = 'api/v3/properties/filter/'
    return this._httpClient.post<FilterResponse>(url, data, { params }).pipe(
      map((response) => response),
      tap((response) => {
        this._properties.next(response)
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching properties')
      }),
    )
  }

  getColumnListProfiles(profileLocation: string, inventoryType: string, brief = false): Observable<Profile[]> {
    const url = 'api/v3/column_list_profiles/'
    const params = {
      organization_id: this.orgId,
      inventory_type: inventoryType,
      profile_location: profileLocation,
      brief,
    }
    return this._httpClient.get<ProfilesResponse>(url, { params }).pipe(
      map((response) => response.data),
      tap((profiles) => {
        console.log('profile response', profiles)
        this._columnListProfiles.next(profiles)
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching column list profiles')
      }),
    )
  }

  getColumnListProfile(id: number): Observable<Profile> {
    const url = `api/v3/column_list_profiles/${id}/`
    const params = { organization_id: this.orgId }
    return this._httpClient.get<ProfileResponse>(url, { params }).pipe(
      map(({ data }) => data),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching column list profile')
      }),
    )
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
}
