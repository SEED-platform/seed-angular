import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { BehaviorSubject, catchError, map, type Observable, take, tap } from 'rxjs'
import { ErrorService } from '@seed/services'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import type { InventoryType } from 'app/modules/inventory'
import { OrganizationService } from '../organization'
import type { InventoryGroup, InventoryGroupResponse, InventoryGroupsResponse } from './groups.types'

@Injectable({ providedIn: 'root' })
export class GroupsService {
  private _errorService = inject(ErrorService)
  private _groups = new BehaviorSubject<InventoryGroup[]>([])
  private _httpClient = inject(HttpClient)
  private _organizationService = inject(OrganizationService)
  private _snackBar = inject(SnackBarService)

  groups$ = this._groups.asObservable()

  list(orgId: number) {
    const url = `/api/v3/inventory_groups/?organization_id=${orgId}`
    this._httpClient
      .get<InventoryGroupsResponse>(url)
      .pipe(
        take(1),
        map(({ data }) => {
          this._groups.next(data)
          return data
        }),
        catchError((error: HttpErrorResponse) => {
          return this._errorService.handleError(error, 'Error fetching groups')
        }),
      )
      .subscribe()
  }

  // inventoryIds (Property/TaxLot[]) are not viewIds
  listForInventory(orgId: number, inventoryIds: number[], type: InventoryType) {
    const url = `/api/v3/inventory_groups/filter/?organization_id=${orgId}&inventory_type=${type}`
    const body = { selected: inventoryIds }
    this._httpClient
      .post<InventoryGroupsResponse>(url, body)
      .pipe(
        take(1),
        map(({ data }) => {
          this._groups.next(data)
          return data
        }),
        catchError((error: HttpErrorResponse) => {
          return this._errorService.handleError(error, 'Error fetching groups for inventory')
        }),
      )
      .subscribe()
  }

  create(orgId: number, data: InventoryGroup): Observable<InventoryGroup> {
    const url = `/api/v3/inventory_groups/?organization_id=${orgId}`
    return this._httpClient.post<InventoryGroupResponse>(url, data).pipe(
      map(({ data }) => {
        this._snackBar.success('Group created successfully')
        this.list(orgId)
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
        this.list(orgId)
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
      tap(() => {
        this._snackBar.success('Group deleted successfully')
        this.list(orgId)
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error deleting group')
      }),
    )
  }

  bulkUpdate(orgId: number, addGroupIds: number[], removeGroupIds: number[], viewIds: number[], type: 'property' | 'tax_lot'): Observable<unknown> {
    const url = `/api/v3/inventory_group_mappings/put/?organization_id=${orgId}`
    const data = {
      inventory_ids: viewIds,
      add_group_ids: addGroupIds,
      remove_group_ids: removeGroupIds,
      inventory_type: type,
    }
    return this._httpClient.put(url, data).pipe(
      tap(() => { this.list(orgId) }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error updating groups')
      }),
    )
  }
}
