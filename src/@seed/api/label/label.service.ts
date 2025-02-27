import type { HttpErrorResponse, HttpResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { catchError, map, ReplaySubject, Subject, takeUntil } from 'rxjs'
import { ErrorService } from '@seed/services'
import { naturalSort } from '@seed/utils'
import { SnackbarService } from 'app/core/snackbar/snackbar.service'
import { UserService } from '../user'
import type { Label } from './label.types'

@Injectable({ providedIn: 'root' })
export class LabelService {
  private _httpClient = inject(HttpClient)
  private _userService = inject(UserService)
  private _labels = new ReplaySubject<Label[]>(1)
  private _errorService = inject(ErrorService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _snackBar = inject(SnackbarService)

  labels$ = this._labels.asObservable()

  constructor() {
    // Fetch current org data whenever user org id changes
    this._userService.currentOrganizationId$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((organizationId) => {
      this.getByOrgId(organizationId).subscribe()
    })
  }

  getByOrgId(org_id: number): Observable<Label[]> {
    const url = `/api/v3/labels/?organization_id=${org_id}`
    return this._httpClient.get<Label[]>(url).pipe(
      map((response) => {
        const labels = response.sort((a, b) => naturalSort(a.name, b.name))
        this._labels.next(labels)
        return labels
      }),
      catchError((error: HttpErrorResponse) => {
        // TODO need to figure out error handling
        return this._errorService.handleError(error, 'Error fetching organization')
      }),
    )
  }

  create(label: Label): Observable<Label> {
    const url = `/api/v3/labels/?organization_id=${label.organization_id}`
    return this._httpClient.post<Label>(url, { ...label }).pipe(
      map((response) => {
        this._snackBar.success('Label Created')
        return response
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, `Error creating label: ${error.message}`)
      }),
    )
  }

  update(label: Label): Observable<Label> {
    const url = `/api/v3/labels/${label.id}/?organization_id=${label.organization_id}`
    return this._httpClient.put<Label>(url, { ...label }).pipe(
      map((response) => {
        this._snackBar.success('Label Mapping Updated')
        return response
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, `Error updating label: ${error.message}`)
      }),
    )
  }

  delete(label: Label): Observable<HttpResponse<null>> {
    const url = `/api/v3/labels/${label.id}/?organization_id=${label.organization_id}`
    return this._httpClient.delete<HttpResponse<null>>(url).pipe(
      map((response) => {
        this._snackBar.success('Label Deleted')
        return response
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, `Error deleting label: ${error.message}`)
      }),
    )
  }
}
