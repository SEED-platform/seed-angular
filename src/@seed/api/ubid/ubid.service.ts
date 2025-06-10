import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { ErrorService } from '@seed/services'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import type { InventoryType, InventoryTypeSingular } from 'app/modules/inventory/inventory.types'
import type { Observable } from 'rxjs'
import { catchError, map, ReplaySubject, Subject, takeUntil, tap } from 'rxjs'
import { UserService } from '../user'
import type { Ubid, UbidDetails, UbidResponse, ValidateUbidResponse } from './ubid.types'

@Injectable({ providedIn: 'root' })
export class UbidService {
  private _httpClient = inject(HttpClient)
  private _userService = inject(UserService)
  private _ubids = new ReplaySubject<Ubid[]>()
  private _errorService = inject(ErrorService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _snackBar = inject(SnackBarService)

  orgId: number
  ubids$ = this._ubids.asObservable()

  constructor() {
    // Fetch current org data whenever user org id changes
    this._userService.currentOrganizationId$.pipe(
      takeUntil(this._unsubscribeAll$),
      tap((orgId) => { this.orgId = orgId }),
    ).subscribe()
  }

  list(orgId: number, viewId: number, type: InventoryType) {
    const typeMap: Record<InventoryType, InventoryTypeSingular> = { properties: 'property', taxlots: 'taxlot' }
    const singularType = typeMap[type]
    const url = `/api/v3/ubid/ubids_by_view/?organization_id=${orgId}`
    const body = { view_id: viewId, type: singularType }
    this._httpClient.post<UbidResponse>(url, body).pipe(
      map(({ data }) => data),
      tap((ubids) => { this._ubids.next(ubids) }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching UBIDs')
      }),
    ).subscribe()
  }

  delete(orgId: number, viewId: number, ubidId: number, type: InventoryType): Observable<object> {
    const url = `/api/v3/ubid/${ubidId}/?organization_id=${orgId}`
    return this._httpClient.delete(url).pipe(
      tap(() => {
        this.list(orgId, viewId, type)
        this._snackBar.success('UBID deleted successfully')
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error deleting UBID')
      }),
    )
  }

  update(orgId: number, viewId: number, ubidId: number, ubid_details: UbidDetails, type: InventoryType): Observable<Ubid> {
    const url = `/api/v3/ubid/${ubidId}/?organization_id=${orgId}`
    return this._httpClient.put<Ubid>(url, ubid_details).pipe(
      tap(() => {
        this.list(orgId, viewId, type)
        this._snackBar.success('UBID updated successfully')
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error updating UBID')
      }),
    )
  }

  create(orgId: number, viewId: number, ubid_details: UbidDetails, type: InventoryType): Observable<Ubid> {
    const url = `/api/v3/ubid/?organization_id=${orgId}`
    return this._httpClient.post<Ubid>(url, ubid_details).pipe(
      tap(() => {
        this.list(orgId, viewId, type)
        this._snackBar.success('UBID created successfully')
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error updating UBID')
      }),
    )
  }

  /* DEVELOPER NOTE
  / Old seed uses UniqueBuildingIdentification, but Im not sure how that was defined
  / ubid_service.js: ubid_factory.validate_ubid_js = (ubid) => UniqueBuildingIdentification.v3.isValid(ubid);
  */
  validate(orgId: number, ubid: string): Observable<boolean> {
    const url = `/api/v3/ubid/validate_ubid/?organization_id=${orgId}`
    return this._httpClient.post<ValidateUbidResponse>(url, { ubid }).pipe(
      map(({ data }) => data.valid),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error validating UBID')
      }),
    )
  }
}
