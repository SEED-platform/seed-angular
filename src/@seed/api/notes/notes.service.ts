import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { ErrorService } from '@seed/services'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import type { InventoryType } from 'app/modules/inventory'
import { BehaviorSubject, catchError, type Observable, Subject, takeUntil, tap } from 'rxjs'
import { OrganizationService } from '../organization'
import type { Note } from './notes.types'

@Injectable({ providedIn: 'root' })
export class NoteService {
  private _errorService = inject(ErrorService)
  private _notes = new BehaviorSubject<unknown>([])
  private _httpClient = inject(HttpClient)
  private _organizationService = inject(OrganizationService)
  private _snackBar = inject(SnackBarService)
  private readonly _unsubscribeAll$ = new Subject<void>()

  notes$ = this._notes.asObservable()
  orgId: number

  constructor() {
    this._organizationService.currentOrganization$
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe(({ org_id }) => this.orgId = org_id)
  }

  list(orgId: number, viewId: number, type: InventoryType): Observable<Note[]> {
    const url = `/api/v3/${type}/${viewId}/notes/?organization_id=${orgId}`
    return this._httpClient.get<Note[]>(url).pipe(
      tap((notes) => { this._notes.next(notes) }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching notes')
      }),
    )
  }
}
