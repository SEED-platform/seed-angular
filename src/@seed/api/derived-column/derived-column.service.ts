import { HttpClient, type HttpErrorResponse } from '@angular/common/http'
import type { OnDestroy } from '@angular/core'
import { inject, Injectable } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import { catchError, Subject, takeUntil, tap } from 'rxjs'
import { ErrorService } from '@seed/services/error/error.service'
import { OrganizationService } from '../organization'
import type { DerivedColumn } from './derived-column.types'

@Injectable({ providedIn: 'root' })
export class DerivedColumnService implements OnDestroy {
  private _httpClient = inject(HttpClient)
  private _organizationService = inject(OrganizationService)
  private _snackBar = inject(MatSnackBar)
  private _errorService = inject(ErrorService)
  private _derivedColumns = new Subject<DerivedColumn[]>()
  private readonly _unsubscribeAll$ = new Subject<void>()

  derivedColumns$ = this._derivedColumns.asObservable()

  get(): void {
    this._organizationService.currentOrganization$
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => {
          console.log('tap')
        }),
        catchError((error: HttpErrorResponse) => {
          return this._errorService.handleError(error, 'Error fetching derived columns')
        }),
      )
      .subscribe()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

}