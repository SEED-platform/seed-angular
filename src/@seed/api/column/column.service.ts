import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { catchError, map, ReplaySubject, Subject, takeUntil } from 'rxjs'
import type { ProgressResponse } from '@seed/api/progress'
import { ErrorService } from '@seed/services/error/error.service'
import { UserService } from '../user'
import type { Column, ColumnsResponse } from './column.types'

@Injectable({ providedIn: 'root' })
export class ColumnService {
  private _httpClient = inject(HttpClient)
  private _errorService = inject(ErrorService)
  private _userService = inject(UserService)

  private _propertyColumns = new ReplaySubject<Column[]>(1)
  private _taxLotColumns = new ReplaySubject<Column[]>(1)
  private readonly _unsubscribeAll$ = new Subject<void>()

  propertyColumns$ = this._propertyColumns.asObservable()
  taxLotColumns$ = this._taxLotColumns.asObservable()

  constructor() {
    // Fetch current org data whenever user org id changes
    this._userService.currentOrganizationId$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((organizationId) => {
      this.getPropertyColumns(organizationId).subscribe()
      this.getTaxLotColumns(organizationId).subscribe()
    })
  }

  getPropertyColumns(organizationId: number): Observable<Column[]> {
    const url = `/api/v3/columns/?inventory_type=property&display_units=true&organization_id=${organizationId}`
    return this._httpClient.get<ColumnsResponse>(url).pipe(
      map((cr) => {
        const cols = cr.columns.filter((c) => c.table_name === 'PropertyState')
        this._propertyColumns.next(cols)
        return cols
      }),
      catchError((error: HttpErrorResponse) => {
        // TODO need to figure out error handling
        return this._errorService.handleError(error, 'Error fetching columns')
      }),
    )
  }

  getTaxLotColumns(organizationId: number): Observable<Column[]> {
    const url = `/api/v3/columns/?inventory_type=taxlot&display_units=true&organization_id=${organizationId}`
    return this._httpClient.get<ColumnsResponse>(url).pipe(
      map((cr) => {
        const cols = cr.columns.filter((c) => c.table_name === 'TaxLotState')
        this._taxLotColumns.next(cols)
        return cols
      }),
      catchError((error: HttpErrorResponse) => {
        // TODO need to figure out error handling
        return this._errorService.handleError(error, 'Error fetching columns')
      }),
    )
  }

  updateMultipleColumns(organization_id: number, table_name: string, changes: object): Observable<ProgressResponse> {
    const url = '/api/v3/columns/update_multiple/'
    return this._httpClient.post<ProgressResponse>(url, { organization_id, table_name, changes }).pipe(
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error updating columns')
      }),
    )
  }

  deleteColumn(column: Column): Observable<ProgressResponse> {
    const url = `/api/v3/columns/${column.id}/?organization_id=${column.organization_id}`
    return this._httpClient.delete<ProgressResponse>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error deleting column')
      }),
    )
  }
}
