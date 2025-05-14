import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { BehaviorSubject, catchError, map, type Observable, Subject, takeUntil, tap } from 'rxjs'
import { ErrorService } from '@seed/services'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import { OrganizationService } from '../organization'
import type { InventoryGroup, InventoryGroupResponse, InventoryGroupsResponse } from './groups.types'

@Injectable({ providedIn: 'root' })
export class GroupsService {
  private _errorService = inject(ErrorService)
  private _groups = new BehaviorSubject<unknown>([])
  private _httpClient = inject(HttpClient)
  private _organizationService = inject(OrganizationService)
  private _snackBar = inject(SnackBarService)
  private readonly _unsubscribeAll$ = new Subject<void>()

  groups$ = this._groups.asObservable()
  orgId: number

  constructor() {
    this._organizationService.currentOrganization$
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe(({ org_id }) => this.orgId = org_id)
  }

  list(orgId: number): Observable<InventoryGroup[]> {
    const url = `/api/v3/inventory_groups/?organization_id=${orgId}`
    return this._httpClient.get<InventoryGroupsResponse>(url).pipe(
      map(({ data }) => {
        this._groups.next(data)
        return data
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching groups')
      }),
    )
  }

  create(orgId: number, data: InventoryGroup): Observable<InventoryGroup> {
    const url = `/api/v3/inventory_groups/?organization_id=${orgId}`
    return this._httpClient.post<InventoryGroupResponse>(url, data).pipe(
      map(({ data }) => {
        this._snackBar.success('Group created successfully')
        return data
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error updating group')
      }),
    )
  }

  update(orgId: number, id: number, data: InventoryGroup): Observable<InventoryGroup> {
    const url = `/api/v3/inventory_groups/${id}/?organization_id=${orgId}`
    return this._httpClient.put<InventoryGroupResponse>(url, data).pipe(
      map(({ data }) => {
        this._snackBar.success('Group updated successfully')
        return data
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error updating group')
      }),
    )
  }

  delete(orgId: number, id: number): Observable<unknown> {
    const url = `/api/v3/inventory_groups/${id}/?organization_id=${orgId}`
    return this._httpClient.delete(url).pipe(
      tap(() => { this._snackBar.success('Group deleted successfully') }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error deleting group')
      }),
    )
  }
}
