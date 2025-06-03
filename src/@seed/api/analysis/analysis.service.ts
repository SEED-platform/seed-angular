import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { catchError, Subject, takeUntil } from 'rxjs'
import { ErrorService } from '@seed/services/error/error.service'
import { UserService } from '../user'
import type { AnalysisSummary } from './analysis.types'

@Injectable({ providedIn: 'root' })
export class AnalysisService {
  private _httpClient = inject(HttpClient)
  private _errorService = inject(ErrorService)
  private _userService = inject(UserService)
  private readonly _unsubscribeAll$ = new Subject<void>()

  orgId: number

  constructor() {
    this._userService.currentOrganizationId$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((organizationId) => {
      this.orgId = organizationId
    })
  }

  summary(orgId: number, cycleId: number): Observable<AnalysisSummary> {
    const url = `/api/v4/analyses/stats/?cycle_id=${cycleId}&organization_id=${orgId}`
    return this._httpClient.get<AnalysisSummary>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching analysis summary')
      }),
    )
  }
}
