import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { BehaviorSubject, catchError, map, Subject, takeUntil, tap } from 'rxjs'
import { OrganizationService } from '@seed/api/organization'
import { ErrorService } from '@seed/services'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import type { DeleteParams, FilterResponse, Profile, ProfileResponse, ProfilesResponse } from 'app/modules/inventory/inventory.types'

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private _httpClient = inject(HttpClient)
  private _organizationService = inject(OrganizationService)
  private _snackBar = inject(SnackBarService)
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

  getAgInventory(paramString: string, data: Record<string, unknown>): Observable<FilterResponse> {
    const url = `api/v4/tax_lot_properties/filter/?${paramString}`
    return this._httpClient.post<FilterResponse>(url, data).pipe(
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

  deletePropertyStates({ orgId, viewIds }: DeleteParams): Observable<object> {
    const url = '/api/v3/properties/batch_delete/'
    const data = { property_view_ids: viewIds }
    const options = { params: { organization_id: orgId }, body: data }
    return this._httpClient.delete(url, options).pipe(
      tap(() => {
        this._snackBar.success('Property states deleted')
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error deleting property states')
      }),
    )
  }
}
