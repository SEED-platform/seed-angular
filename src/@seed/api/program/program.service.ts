import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { ErrorService } from '@seed/services'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import type { Observable } from 'rxjs'
import { catchError, map, ReplaySubject, tap } from 'rxjs'
import { UserService } from '../user'
import type { Program, ProgramData, ProgramResponse, ProgramsResponse } from './program.types'

@Injectable({ providedIn: 'root' })
export class ProgramService {
  private _httpClient = inject(HttpClient)
  private _programs = new ReplaySubject<Program[]>(1)
  private _errorService = inject(ErrorService)
  private _snackBar = inject(SnackBarService)
  private _userService = inject(UserService)
  programs$ = this._programs
  orgId: number

  constructor() {
    this._userService.currentOrganizationId$
      .pipe(
        tap((orgId) => { this.list(orgId) }),
      )
      .subscribe()
  }

  list(orgId: number) {
    const url = `/api/v3/compliance_metrics/?organization_id=${orgId}`
    this._httpClient.get<ProgramsResponse>(url).pipe(
      map(({ compliance_metrics }) => {
        this.programs$.next(compliance_metrics)
        return compliance_metrics
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching Programs')
      }),
    ).subscribe()
  }

  create(orgId: number, data: Program): Observable<ProgramResponse> {
    const url = `/api/v3/compliance_metrics/?organization_id=${orgId}`
    return this._httpClient.post<ProgramResponse>(url, data).pipe(
      tap(() => {
        this.list(orgId)
        this._snackBar.success('Successfully created Program')
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error creating Program')
      }),
    )
  }

  update(orgId: number, programId: number, data: Program): Observable<ProgramResponse> {
    const url = `/api/v3/compliance_metrics/${programId}/?organization_id=${orgId}`
    return this._httpClient.put<ProgramResponse>(url, data).pipe(
      tap(() => {
        this.list(orgId)
        this._snackBar.success('Successfully updated Program')
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error updating Program')
      }),
    )
  }

  delete(orgId: number, programId: number): Observable<ProgramResponse> {
    const url = `/api/v3/compliance_metrics/${programId}/?organization_id=${orgId}`
    return this._httpClient.delete<ProgramResponse>(url).pipe(
      tap(() => {
        this.list(orgId)
        this._snackBar.success('Successfully deleted Program')
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error deleting Program')
      }),
    )
  }

  evaluate(orgId: number, programId: number): Observable<ProgramData> {
    const url = `/api/v3/compliance_metrics/${programId}/evaluate/?organization_id=${orgId}`
    return this._httpClient.get<{ data: ProgramData }>(url).pipe(
      map(({ data }) => data),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error evaluating Program')
      }),
    )
  }
}
