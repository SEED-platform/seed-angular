import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { ErrorService } from '@seed/services'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import { catchError, type Observable, tap } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class ScenarioService {
  private _httpClient = inject(HttpClient)
  private _errorService = inject(ErrorService)
  private _snackBar = inject(SnackBarService)

  deleteScenario(orgId: number, viewId: number, scenarioId: number): Observable<unknown> {
    const url = `api/v3/properties/${viewId}/scenarios/${scenarioId}/?organization_id=${orgId}`
    return this._httpClient.delete<unknown>(url, {}).pipe(
      tap(() => {
        this._snackBar.success('Successfully deleted scenario')
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error deleting scenario')
      }),
    )
  }
}
