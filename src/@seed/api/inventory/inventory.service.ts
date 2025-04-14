import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { BehaviorSubject, catchError, map, Subject, takeUntil, tap, throwError } from 'rxjs'
import { OrganizationService } from '@seed/api/organization'
import { ErrorService } from '@seed/services'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import type { DeleteParams, FilterResponse, GenericView, GenericViewsResponse, InventoryType, Profile, ProfileResponse, ProfilesResponse, UpdateInventoryResponse, ViewResponse } from 'app/modules/inventory/inventory.types'

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

  /*
  * Get PropertyView or TaxLotView
  */
  getView(orgId: number, viewId: number, inventoryType: InventoryType): Observable<ViewResponse> {
    return inventoryType === 'taxlots' ? this.getTaxLotView(orgId, viewId) : this.getPropertyView(orgId, viewId)
  }

  getPropertyView(orgId: number, viewId: number): Observable<ViewResponse> {
    const url = `/api/v3/properties/${viewId}/`
    const params = { organization_id: orgId }
    return this._httpClient.get<ViewResponse>(url, { params }).pipe(
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching property')
      }),
    )
  }

  getTaxLotView(orgId: number, viewId: number): Observable<ViewResponse> {
    const url = `/api/v3/taxlots/${viewId}/`
    const params = { organization_id: orgId }
    return this._httpClient.get<ViewResponse>(url, { params }).pipe(
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching property')
      }),
    )
  }

  /*
  * Get PropertyViews or TaxLotViews given a Property or Taxlot id
  */
  getViews(orgId: number, id: number, inventoryType: InventoryType): Observable<GenericView[]> {
    return inventoryType === 'taxlots' ? this.getTaxLotViews(orgId, id) : this.getPropertyViews(orgId, id)
  }

  getPropertyViews(orgId: number, propertyId: number): Observable<GenericView[]> {
    const url = '/api/v3/property_views/'
    const params = { organization_id: orgId, property: propertyId }
    return this._httpClient.get<GenericViewsResponse>(url, { params }).pipe(
      map(({ property_views }) => property_views),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching property')
      }),
    )
  }

  getTaxLotViews(orgId: number, taxLotId: number): Observable<GenericView[]> {
    const url = '/api/v3/taxlot_views/'
    const params = { organization_id: orgId, taxlot: taxLotId }
    return this._httpClient.get<GenericViewsResponse>(url, { params }).pipe(
      map(({ taxlot_views }) => taxlot_views),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching taxlot')
      }),
    )
  }

  /*
  * Update a property/taxlot view's state
  */
  updateInventory(orgId: number, viewId: number, inventoryType: InventoryType, updatedStateFields: Record<string, unknown>): Observable<UpdateInventoryResponse> {
    return inventoryType === 'taxlots'
      ? this.updateTaxLot(orgId, viewId, updatedStateFields)
      : this.updateProperty(orgId, viewId, updatedStateFields)
  }

  updateProperty(orgId: number, viewId: number, state: Record<string, unknown>): Observable<UpdateInventoryResponse> {
    const url = `/api/v3/properties/${viewId}/?organization_id=${orgId}`
    return this._httpClient.put<UpdateInventoryResponse>(url, { state }).pipe(
      tap((response) => {
        this._snackBar.success(`Success! - ${response.match_link_count} Linked. ${response.match_merged_count} Merged`)
      }),
      catchError((error: HttpErrorResponse) => {
        // errors tend to be non human readable
        this._snackBar.alert('Error updating property')
        return throwError(() => error)
      }),
    )
  }

  updateTaxLot(orgId: number, viewId: number, state: Record<string, unknown>): Observable<UpdateInventoryResponse> {
    const url = `/api/v3/taxlots/${viewId}/?organization_id=${orgId}`
    return this._httpClient.put<UpdateInventoryResponse>(url, { state }).pipe(
      tap((response) => {
        this._snackBar.success(`Success! - ${response.match_link_count} Linked. ${response.match_merged_count} Merged`)
      }),
      catchError((error: HttpErrorResponse) => {
        // errors tend to be non human readable
        this._snackBar.alert('Error updating taxlot')
        return throwError(() => error)
      }),
    )
  }
}
