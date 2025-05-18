import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { OrganizationService } from '@seed/api/organization'
import { ErrorService } from '@seed/services'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
// import type { Observable } from 'rxjs'
import { BehaviorSubject, catchError, forkJoin, map, Observable, Subject, takeUntil, tap } from 'rxjs'
import type { Analysis, AnalysisResponse, AnalysesMessage, AnalysesViews, AnalysisView, AnalysisViews, ListAnalysesResponse, ListMessagesResponse, OriginalView, PropertyAnalysesResponse, View } from './analysis.types'

@Injectable({ providedIn: 'root' })
export class AnalysisService {
  private _httpClient = inject(HttpClient)
  private _organizationService = inject(OrganizationService)
  private _snackBar = inject(SnackBarService)
  private _errorService = inject(ErrorService)
  private _analyses = new BehaviorSubject<Analysis[]>([]) // BehaviorSubject to hold the analyses
  private _views = new BehaviorSubject<View[]>([])
  private _originalViews = new BehaviorSubject<OriginalView[]>([])
  private _messages = new BehaviorSubject<AnalysesMessage[]>([])
  private readonly _unsubscribeAll$ = new Subject<void>()
  orgId: number
  analyses$ = this._analyses.asObservable() // Expose the observable for components to subscribe
  views$ = this._views.asObservable()
  originalViews$ = this._originalViews.asObservable()
  messages$ = this._messages.asObservable()

  constructor() {
    this._organizationService.currentOrganization$
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(({ org_id }) => {
          this.orgId = org_id
        }),
      )
      .subscribe()
  }

  // Method to update the analyses list
  updateAnalyses(analyses: Analysis[]): void {
    this._analyses.next(analyses)
  }

  getAnalyses(): Observable<AnalysesViews> {
    return this._httpClient
      .get<ListAnalysesResponse>(`/api/v3/analyses/?organization_id=${this.orgId}`)
      .pipe(
        map((response) => response),
        tap((response) => {
          this._analyses.next(response.analyses)
          this._views.next(response.views)
          this._originalViews.next(response.original_views)
        }),
        catchError((error: HttpErrorResponse) => {
          return this._errorService.handleError(error, 'Error fetching analyses')
        }),
      )
  }

  // get AnalysesMessages (for all analyses or for a single one)
  getMessages(_analysisId = '0'): Observable<AnalysesMessage[]> {
    return this._httpClient
      .get<ListMessagesResponse>(`/api/v3/analyses/${_analysisId}/messages/?organization_id=${this.orgId}`)
      .pipe(
        map((response) => response.messages),
        tap((response) => {
          this._messages.next(response)
        }),
        catchError((error: HttpErrorResponse) => {
          return this._errorService.handleError(error, 'Error fetching analyses messages')
        }),
      )
  }

  // get single analysis
  getAnalysis(_analysisId): Observable<Analysis> {
    return this._httpClient
      .get<AnalysisResponse>(`/api/v3/analyses/${_analysisId}?organization_id=${this.orgId}`)
      .pipe(
        map((response) => response.analysis),
        catchError((error: HttpErrorResponse) => {
          return this._errorService.handleError(error, 'Error fetching analyses')
        }),
      )
  }

  // get analyses for a property (by property ID)
  getPropertyAnalyses(_propertyId): Observable<Analysis[]> {
    return this._httpClient
      .get<PropertyAnalysesResponse>(`/api/v3/properties/${_propertyId}/analyses/?organization_id=${this.orgId}`)
      .pipe(
        map((response) => response.analyses),
        catchError((error: HttpErrorResponse) => {
          return this._errorService.handleError(error, 'Error fetching analyses for this property')
        }),
      )
  }

  // get single analysis view (from a single run)
  getRun(_analysisId, _runId): Observable<AnalysisView> {
    return this._httpClient
      .get<AnalysisView>(`/api/v3/analyses/${_analysisId}/views/${_runId}?organization_id=${this.orgId}`)
      .pipe(
        map((response) => response),
        catchError((error: HttpErrorResponse) => {
          return this._errorService.handleError(error, 'Error fetching analysis run')
        }),
      )
  }

  // get analysis views
  getAnalysisViews(_analysisId): Observable<AnalysisViews> {
    return this._httpClient
      .get<AnalysisViews>(`/api/v3/analyses/${_analysisId}/views?organization_id=${this.orgId}`)
      .pipe(
        map((response) => response),
        catchError((error: HttpErrorResponse) => {
          return this._errorService.handleError(error, 'Error fetching analyses')
        }),
      )
  }

  // delete analysis
  delete(id: number) {
    const url = `/api/v3/analyses/${id}/?organization_id=${this.orgId}`
    return this._httpClient.delete(url).pipe(
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error deleting analysis')
      }),
    )
  }

  // poll for completion (pass in list of analyses that are still running)
  // This function should be called on an interval until all analyses are completed
  // For the analyses provided, poll for Completion one at a time
  // Completion statuses include: 'Failed', 'Stopped', 'Completed'
  pollForCompletion(analyses: Analysis[]): Observable<AnalysesViews> {
    const completionStatuses = ['Failed', 'Stopped', 'Completed']
    return new Observable<AnalysesViews>((observer) => {
      let remainingAnalyses = [...analyses] // Clone the list of analyses to track remaining ones
      const pollInterval = setInterval(() => {
        const analysisRequests = remainingAnalyses.map((analysis) => this.getAnalysis(analysis.id))
        forkJoin(analysisRequests).subscribe({
          next: (updatedAnalyses) => {
            // Get the current list of analyses from the BehaviorSubject
            const currentAnalyses = this._analyses.getValue()
            // Merge the updated analyses into the current list
            const mergedAnalyses = currentAnalyses.map((analysis) => {
              const updatedAnalysis = updatedAnalyses.find((updated) => updated.id === analysis.id)
              if (updatedAnalysis) {
                const isCompletionStatus = completionStatuses.includes(updatedAnalysis.status)
                const statusChanged = analysis.status !== updatedAnalysis.status
                // Only update the analysis if the status has changed to a completion status
                if (isCompletionStatus && statusChanged) {
                  return updatedAnalysis
                }
              }
              // If no update is needed, return the original analysis
              return analysis
            })
            // Emit the merged list to the BehaviorSubject
            this._analyses.next(mergedAnalyses)
            // Remove analyses that have reached a completion status
            remainingAnalyses = remainingAnalyses.filter(
              (analysis) => !updatedAnalyses.some(
                (updated) => updated.id === analysis.id && completionStatuses.includes(updated.status)
              ),
            )
            // If all analyses have reached a completion status, complete the observable
            if (remainingAnalyses.length === 0) {
              clearInterval(pollInterval)
              observer.next({
                analyses: mergedAnalyses,
                views: this._views.getValue(), // Assuming views are already stored in the BehaviorSubject
              })
              observer.complete()
            }
          },
          error: (error: HttpErrorResponse) => {
            clearInterval(pollInterval)
            observer.error(this._errorService.handleError(error, 'Error polling for completion'))
          },
        })
      }, 5000) // Poll every 5 seconds
    })
  }
}
