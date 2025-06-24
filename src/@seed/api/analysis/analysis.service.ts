import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { BehaviorSubject, catchError, map, Observable, Subject, takeUntil, tap } from 'rxjs'
import { OrganizationService } from '@seed/api/organization'
import { ErrorService } from '@seed/services'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import { UserService } from '../user'
import type { AnalysesMessage, Analysis, AnalysisResponse, AnalysisServiceType, AnalysisSummary, AnalysisView, AnalysisViews, ListAnalysesResponse, ListMessagesResponse, OriginalView, PropertyAnalysesResponse, View } from './analysis.types'

@Injectable({ providedIn: 'root' })
export class AnalysisService {
  private _httpClient = inject(HttpClient)
  private _organizationService = inject(OrganizationService)
  private _userService = inject(UserService)
  private _snackBar = inject(SnackBarService)
  private _errorService = inject(ErrorService)
  private _analyses = new BehaviorSubject<Analysis[]>([])
  private _analysis = new BehaviorSubject<Analysis>(null)
  private _views = new BehaviorSubject<View[]>([])
  private _orgId = new BehaviorSubject<number>(null)
  private _originalViews = new BehaviorSubject<OriginalView[]>([])
  private _messages = new BehaviorSubject<AnalysesMessage[]>([])
  private readonly _unsubscribeAll$ = new Subject<void>()
  orgId: number
  analyses$ = this._analyses.asObservable()
  analysis$ = this._analysis.asObservable()
  views$ = this._views.asObservable()
  originalViews$ = this._originalViews.asObservable()
  messages$ = this._messages.asObservable()

  constructor() {
    this._userService.currentOrganizationId$
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap((orgId) => {
          this.orgId = orgId
          this.getAnalyses(orgId)
        }),
      )
      .subscribe()
  }

  // Method to update the analyses list
  updateAnalyses(analyses: Analysis[]): void {
    this._analyses.next(analyses)
  }

  getAnalyses(orgId: number) {
    const url = `/api/v3/analyses/?organization_id=${orgId}`
    this._httpClient.get<ListAnalysesResponse>(url).pipe(
      map((response) => response),
      tap((response) => {
        this._analyses.next(response.analyses)
        this._views.next(response.views)
        this._originalViews.next(response.original_views)
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching analyses')
      }),
    ).subscribe()
  }

  // get AnalysesMessages (for all analyses or for a single one)
  getMessages(orgId: number, analysisId: number) {
    const url = `/api/v3/analyses/${analysisId}/messages/?organization_id=${orgId}`
    this._httpClient.get<ListMessagesResponse>(url).pipe(
      map((response) => response.messages),
      tap((response) => { this._messages.next(response) }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching analyses messages')
      }),
    ).subscribe()
  }

  // get single analysis
  getAnalysis(orgId: number, analysisId) {
    const url = `/api/v3/analyses/${analysisId}?organization_id=${orgId}`
    this._httpClient.get<AnalysisResponse>(url).pipe(
      map((response) => response.analysis),
      tap((analysis) => { this._analysis.next(analysis) }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching analyses')
      }),
    ).subscribe()
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
  getAnalysisViews(orgId: number, analysisId: number) {
    const url = `/api/v3/analyses/${analysisId}/views?organization_id=${orgId}`
    this._httpClient.get<AnalysisViews>(url).pipe(
      tap((response) => {
        this._views.next(response.views)
        this._originalViews.next(response.original_views)
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching analyses')
      }),
    ).subscribe()
  }

  // delete analysis
  delete(orgId: number, id: number) {
    const url = `/api/v3/analyses/${id}/?organization_id=${this.orgId}`
    return this._httpClient.delete(url).pipe(
      tap(() => {
        this._snackBar.success('Analysis deleted successfully')
        this.getAnalyses(orgId)
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error deleting analysis')
      }),
    )
  }

  // poll for completion (pass in list of analyses that are still running)
  // This function should be called on an interval until all analyses are completed
  // For the analyses provided, poll for Completion one at a time
  // Completion statuses include: 'Failed', 'Stopped', 'Completed'
  // pollForCompletion(analyses: Analysis[]): Observable<AnalysesViews> {
  //   const completionStatuses = ['Failed', 'Stopped', 'Completed']
  //   return new Observable<AnalysesViews>((observer) => {
  //     let remainingAnalyses = [...analyses] // Clone the list of analyses to track remaining ones
  //     const pollInterval = setInterval(() => {
  //       const analysisRequests = remainingAnalyses.map((analysis) => this.getAnalysis(this.orgId, analysis.id))
  //       forkJoin(analysisRequests).subscribe({
  //         next: (updatedAnalyses) => {
  //           // Get the current list of analyses from the BehaviorSubject
  //           const currentAnalyses = this._analyses.getValue()
  //           // Merge the updated analyses into the current list
  //           const mergedAnalyses = currentAnalyses.map((analysis) => {
  //             const updatedAnalysis = updatedAnalyses.find((updated) => updated.id === analysis.id)
  //             if (updatedAnalysis) {
  //               const isCompletionStatus = completionStatuses.includes(updatedAnalysis.status)
  //               const statusChanged = analysis.status !== updatedAnalysis.status
  //               // Only update the analysis if the status has changed to a completion status
  //               if (isCompletionStatus && statusChanged) {
  //                 return updatedAnalysis
  //               }
  //             }
  //             // If no update is needed, return the original analysis
  //             return analysis
  //           })
  //           // Emit the merged list to the BehaviorSubject
  //           this._analyses.next(mergedAnalyses)
  //           // Remove analyses that have reached a completion status
  //           remainingAnalyses = remainingAnalyses.filter(
  //             (analysis) => !updatedAnalyses.some(
  //               (updated) => updated.id === analysis.id && completionStatuses.includes(updated.status),
  //             ),
  //           )
  //           // If all analyses have reached a completion status, complete the observable
  //           if (remainingAnalyses.length === 0) {
  //             clearInterval(pollInterval)
  //             observer.next({
  //               analyses: mergedAnalyses,
  //               views: this._views.getValue(), // Assuming views are already stored in the BehaviorSubject
  //             })
  //             observer.complete()
  //           }
  //         },
  //         error: (error: HttpErrorResponse) => {
  //           clearInterval(pollInterval)
  //           observer.error(this._errorService.handleError(error, 'Error polling for completion'))
  //         },
  //       })
  //     }, 5000) // Poll every 5 seconds
  //   })
  // }

  getAnalysisDescription(analysis: Analysis): string {
    const descriptionMap: Record<AnalysisServiceType, string> = {
      BETTER: "The BETTER analysis leverages better.lbl.gov to calculate energy, cost, and GHG emission savings by comparing the property's change point model with a benchmarked model. The results include saving potential and a list of recommended high-level energy conservation measures.",
      BSyncr: 'The BSyncr analysis leverages the Normalized Metered Energy Consumption (NMEC) analysis to calculate a change point model. The data are passed to the analysis using BuildingSync. The result of the analysis are the coefficients of the change point model.',
      'Building Upgrade Recommendation': 'The Building Upgrade Recommendation analysis implements a workflow to identify buildings that may need a deep energy retrofit, equipment replaced or re-tuning based on building attributes such as energy use, year built, and square footage. If your organization contains elements, the Element Statistics Analysis should be run prior to running this analysis.',
      CO2: "This analysis calculates the average annual CO2 emissions for the property's meter data. The analysis requires an eGRID Subregion to be defined in order to accurately determine the emission rates.",
      EEEJ: "The EEEJ Analysis uses each property's address to identify the 2010 census tract. Based on census tract, disadvantaged community classification and energy burden information can be retrieved from the CEJST dataset. The number of affordable housing locations is retrieved from HUD datasets. Location is used to generate a link to view an EJScreen Report providing more demographic indicators.",
      EUI: "The EUI analysis will sum the property's meter readings for the last twelve months to calculate the energy use per square footage per year. If there are missing meter readings, then the analysis will return a less that 100% coverage to alert the user that there is a missing meter reading.",
      'Element Statistics': "The Element Statistics analysis looks through a property's element data (if any) to count the number of elements of type 'D.D.C. Control Panel'. It also generates the aggregated (average) condition index values for scope 1 emission elements and saves those quantities to the property.",
    }
    return descriptionMap[analysis.service] ?? 'No description available for this analysis.'
  }

  getRunDuration({ data }: { data: Analysis }) {
    const start = new Date(data.start_time)
    const end = new Date(data.end_time)
    const duration = Math.abs(end.getTime() - start.getTime())
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((duration % (1000 * 60)) / 1000)
    return `${minutes}m ${seconds}s`
  }
}
