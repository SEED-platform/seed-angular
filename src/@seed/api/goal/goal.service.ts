import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { BehaviorSubject, catchError, map, take, tap } from 'rxjs'
import { OrganizationService } from '@seed/api/organization'
import { ErrorService } from '@seed/services'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import type { CycleGoal, Goal, GoalsResponse, PortfolioSummary, weightedEUIsResponse } from './goal.types'

@Injectable({ providedIn: 'root' })
export class GoalService {
  private _httpClient = inject(HttpClient)
  private _organizationService = inject(OrganizationService)
  private _snackBar = inject(SnackBarService)
  private _errorService = inject(ErrorService)
  private _goals = new BehaviorSubject<Goal[]>([])
  private _portfolioSummary = new BehaviorSubject<PortfolioSummary>(undefined)
  orgId: number

  goals$ = this._goals.asObservable()

  constructor() {
    this._organizationService.currentOrganization$
      .pipe(
        tap(({ org_id }) => {
          this.get(org_id)
          this.orgId = org_id
        }),
      )
      .subscribe()
  }

  get(orgId: number) {
    const url = `/api/v3/goals/?organization_id=${orgId}`
    this._httpClient
      .get<GoalsResponse>(url)
      .pipe(
        take(1),
        map(({ goals }) => goals),
        tap((goals) => {
          this._goals.next(goals)
        }),
        catchError((error: HttpErrorResponse) => {
          return this._errorService.handleError(error, 'Error fetching goals')
        }),
      )
      .subscribe()
  }

  getPortfolioSummary(goalId: number, cycleGoalId: number, orgId: number): Observable<PortfolioSummary> {
    const url = `/api/v3/goals/${goalId}/cycles/${cycleGoalId}/portfolio_summary?organization_id=${orgId}`
    return this._httpClient.get<PortfolioSummary>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, `Error fetching summary: ${error.message}`)
      }),
    )
  }

  getWeightedEUIs(goalId: number, orgId: number): Observable<weightedEUIsResponse> {
    const url = `/api/v3/goals/${goalId}/get_weighted_euis/?organization_id=${orgId}`
    return this._httpClient.get<weightedEUIsResponse>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, `Error fetching summary: ${error.message}`)
      }),
    )
  }

  editGoal(goalId: number, editedGoal, orgId: number): Observable<Goal> {
    const url = `/api/v3/goals/${goalId}/?organization_id=${orgId}`
    return this._httpClient.put<Goal>(url, editedGoal).pipe(
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, `Error fetching summary: ${error.message}`)
      }),
    )
  }

  createGoal(newGoal, orgId: number): Observable<Goal> {
    const url = `/api/v3/goals/?organization_id=${orgId}`
    return this._httpClient.post<Goal>(url, { ...newGoal, organization: orgId }).pipe(
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, `Error fetching summary: ${error.message}`)
      }),
    )
  }

  createCycleGoal(goalId: number, cycleId: number, annual_report_id: string, annual_report_name: string): Observable<CycleGoal> {
    const url = `/api/v3/goals/${goalId}/cycles/?organization_id=${this.orgId}`
    return this._httpClient
      .post<CycleGoal>(url, {
        current_cycle: cycleId,
        salesforce_annual_report_id: annual_report_id,
        salesforce_annual_report_name: annual_report_name,
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return this._errorService.handleError(error, `Error fetching summary: ${error.message}`)
        }),
      )
  }
}
