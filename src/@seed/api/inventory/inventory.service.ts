import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { BehaviorSubject, catchError, map, tap, throwError } from 'rxjs'
import { ErrorService } from '@seed/services'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import type { CrossCyclesResponse, DeleteParams, FilterResponse, GenericView, GenericViewsResponse, InventoryDisplayType, InventoryType, InventoryTypeGoal, NewProfileData, Profile, ProfileResponse, ProfilesResponse, PropertyDocumentExtension, UpdateInventoryResponse, ViewResponse } from 'app/modules/inventory/inventory.types'
import { UserService } from '../user'

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private _httpClient = inject(HttpClient)
  private _userService = inject(UserService)
  private _snackBar = inject(SnackBarService)
  private _errorService = inject(ErrorService)
  private _properties = new BehaviorSubject<unknown>([])
  private _columnListProfiles = new BehaviorSubject<Profile[]>([])
  private _view = new BehaviorSubject<ViewResponse>(null)
  orgId: number

  columnListProfiles$ = this._columnListProfiles.asObservable()
  properties$ = this._properties.asObservable()
  view$ = this._view.asObservable()

  constructor() {
    this._userService.currentOrganizationId$.subscribe((id) => this.orgId = id)
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

  getRecordCount(organization_id: number, cycle_id: number, inventory_type: InventoryTypeGoal): Observable<number> {
    const url = '/api/v4/tax_lot_properties/record_count/'
    const params = { organization_id, cycle_id, inventory_type }
    return this._httpClient.get<{ status: string; data: number }>(url, { params }).pipe(
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching record count')
      }),
    )
  }

  getColumnListProfiles(profileLocation: string, inventoryType: string, brief = false) {
    const url = 'api/v3/column_list_profiles/'
    const params = {
      organization_id: this.orgId,
      inventory_type: inventoryType,
      profile_location: profileLocation,
      brief,
    }
    this._httpClient.get<ProfilesResponse>(url, { params }).pipe(
      map((response) => response.data),
      tap((profiles) => {
        this._columnListProfiles.next(profiles)
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching column list profiles')
      }),
    ).subscribe()
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

  updateProfileToShowPopulatedColumns(orgId: number, id: number, cycle_id: number, inventory_type: InventoryDisplayType): Observable<Profile> {
    const url = `/api/v3/column_list_profiles/${id}/show_populated/?organization_id=${orgId}`
    const data = { cycle_id, inventory_type }
    return this._httpClient.put<ProfileResponse>(url, data).pipe(
      map(({ data }) => data),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error updating column list profile')
      }),
    )
  }

  createColumnListProfile(orgId: number, data: NewProfileData): Observable<Profile> {
    const url = `/api/v3/column_list_profiles/?organization_id=${orgId}`
    return this._httpClient.post<ProfileResponse>(url, data).pipe(
      tap(() => { this._snackBar.success('Profile created successfully') }),
      map(({ data }) => data),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error creating column list profile')
      }),
    )
  }

  updateColumnListProfile(orgId: number, id: number, data: unknown): Observable<Profile> {
    const url = `/api/v3/column_list_profiles/${id}/?organization_id=${orgId}`
    return this._httpClient.put<ProfileResponse>(url, data).pipe(
      tap(() => { this._snackBar.success('Profile updated successfully') }),
      map(({ data }) => data),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error creating column list profile')
      }),
    )
  }

  deleteColumnListProfile(orgId: number, id: number): Observable<null> {
    const url = `/api/v3/column_list_profiles/${id}/?organization_id=${orgId}`
    return this._httpClient.delete<null>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error deleting column list profile')
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
      tap((view) => { this._view.next(view) }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching property')
      }),
    )
  }

  getTaxLotView(orgId: number, viewId: number): Observable<ViewResponse> {
    const url = `/api/v3/taxlots/${viewId}/`
    const params = { organization_id: orgId }
    return this._httpClient.get<ViewResponse>(url, { params }).pipe(
      tap((view) => { this._view.next(view) }),
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
        this._snackBar.alert('Error updating property. Check data types and try again')
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
        this._snackBar.alert('Error updating taxlot. Check data types and try again')
        return throwError(() => error)
      }),
    )
  }

  uploadPropertyDocument(orgId: number, viewId: number, file: File, fileExt: PropertyDocumentExtension): Observable<unknown> {
    const url = `/api/v3/properties/${viewId}/upload_inventory_document/?organization_id=${orgId}`
    const formData = new FormData()
    formData.append('file', file, file.name)
    formData.append('file_type', fileExt)
    return this._httpClient.put<unknown>(url, formData).pipe(
      tap(() => {
        this._snackBar.success('Document uploaded successfully')
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error Uploading Document')
      }),
    )
  }

  deletePropertyDocument(orgId: number, viewId: number, file_id: string): Observable<object> {
    const url = `/api/v3/properties/${viewId}/delete_inventory_document/?organization_id=${orgId}&file_id=${file_id}`
    return this._httpClient.delete(url).pipe(
      tap(() => {
        this._snackBar.success('Document deleted successfully')
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error deleting Document')
      }),
    )
  }

  filterByCycle(orgId: number, profileId: number, cycleIds: number[], inventoryType: InventoryType): Observable<CrossCyclesResponse> {
    const url = `/api/v3/${inventoryType}/filter_by_cycle/`
    const data = {
      organization_id: orgId,
      profile_id: profileId,
      cycle_ids: cycleIds,
    }

    return this._httpClient.post<CrossCyclesResponse>(url, data).pipe(
      // map((response) => {
      //   return response
      // }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, `Error fetching ${inventoryType}`)
      }),
    )
  }
}
