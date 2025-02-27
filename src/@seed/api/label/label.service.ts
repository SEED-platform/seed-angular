import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { catchError, map, ReplaySubject, Subject, takeUntil } from 'rxjs'
import { ErrorService } from '@seed/services'
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
        this._labels.next(response)
        return response
      }),
      catchError((error: HttpErrorResponse) => {
        // TODO need to figure out error handling
        return this._errorService.handleError(error, 'Error fetching organization')
      }),
    )
  }
}
