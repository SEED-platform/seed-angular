import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { ErrorService } from '@seed/services'
import { UserService } from '../user'
import { catchError, map, type Observable } from 'rxjs'
import type { FirstFiveRowsResponse, MappingSuggestionsResponse, RawColumnNamesResponse } from './mapping.types'

@Injectable({ providedIn: 'root' })
export class MappingService {
  private _httpClient = inject(HttpClient)
  private _errorService = inject(ErrorService)
  private _userService = inject(UserService)

  mappingSuggestions(orgId: number, importFileId: number): Observable<MappingSuggestionsResponse> {
    const url = `/api/v3/import_files/${importFileId}/mapping_suggestions/?organization_id=${orgId}`
    return this._httpClient.get<MappingSuggestionsResponse>(url)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return this._errorService.handleError(error, 'Error fetching mapping suggestions')
        }),
      )
  }

  rawColumnNames(orgId: number, importFileId: number): Observable<string[]> {
    const url = `/api/v3/import_files/${importFileId}/raw_column_names/?organization_id=${orgId}`
    return this._httpClient.get<RawColumnNamesResponse>(url)
      .pipe(
        map(({ raw_columns }) => raw_columns ),
        catchError((error: HttpErrorResponse) => {
          return this._errorService.handleError(error, 'Error fetching raw column names')
        }),
      )
  }

  firstFiveRows(orgId: number, importFileId: number): Observable<Record<string, unknown>[]> {
    const url = `/api/v3/import_files/${importFileId}/first_five_rows/?organization_id=${orgId}`
    return this._httpClient.get<FirstFiveRowsResponse>(url)
      .pipe(
        map(({ first_five_rows }) => first_five_rows),
        catchError((error: HttpErrorResponse) => {
          return this._errorService.handleError(error, 'Error fetching first five rows')
        }),
      )
  }
}
