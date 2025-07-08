import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { catchError, map, ReplaySubject, tap } from 'rxjs'
import { ErrorService } from '@seed/services'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import { UserService } from '../user'
import type {
  ColumnMapping,
  ColumnMappingProfile,
  ColumnMappingProfileDeleteResponse,
  ColumnMappingProfilesRequest,
  ColumnMappingProfileType,
  ColumnMappingProfileUpdateResponse,
  ColumnMappingSuggestionResponse,
} from './column_mapping_profile.types'

@Injectable({ providedIn: 'root' })
export class ColumnMappingProfileService {
  private _httpClient = inject(HttpClient)
  private _userService = inject(UserService)
  private _profiles = new ReplaySubject<ColumnMappingProfile[]>(1)
  private _errorService = inject(ErrorService)
  private _snackBar = inject(SnackBarService)

  profiles$ = this._profiles.asObservable()

  constructor() {
    // Fetch current org data whenever user org id changes
    this._userService.currentOrganizationId$.subscribe((organizationId) => {
      this.getProfiles(organizationId).subscribe()
    })
  }

  getProfiles(org_id: number, columnMappingProfileTypes: ColumnMappingProfileType[] = []): Observable<ColumnMappingProfile[]> {
    const url = `/api/v3/column_mapping_profiles/filter/?organization_id=${org_id}`
    const data: Record<string, unknown> = {}
    if (columnMappingProfileTypes.length) {
      data.profile_type = columnMappingProfileTypes
    }
    return this._httpClient.post<ColumnMappingProfilesRequest>(url, data).pipe(
      map((response) => {
        this._profiles.next(response.data)
        return response.data
      }),
      catchError((error: HttpErrorResponse) => {
        // TODO need to figure out error handling
        return this._errorService.handleError(error, 'Error fetching column mapping profiles')
      }),
    )
  }

  updateMappings(org_id: number, profile_id: number, mappings: ColumnMapping[]): Observable<ColumnMappingProfile> {
    const url = `/api/v3/column_mapping_profiles/${profile_id}/?organization_id=${org_id}`
    return this._httpClient.put<ColumnMappingProfileUpdateResponse>(url, { mappings }).pipe(
      map((response) => {
        return response.data
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error updating profile')
      }),
    )
  }

  update(org_id: number, profile: ColumnMappingProfile): Observable<ColumnMappingProfile> {
    const url = `/api/v3/column_mapping_profiles/${profile.id}/?organization_id=${org_id}`
    return this._httpClient.put<ColumnMappingProfileUpdateResponse>(url, profile).pipe(
      map((response) => {
        return response.data
      }),
      tap(() => { this._snackBar.success('Profile updated successfully') }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error updating profile')
      }),
    )
  }

  delete(org_id: number, profile_id: number): Observable<ColumnMappingProfileDeleteResponse> {
    const url = `/api/v3/column_mapping_profiles/${profile_id}/?organization_id=${org_id}`
    return this._httpClient.delete<ColumnMappingProfileDeleteResponse>(url).pipe(
      map((response) => {
        return response
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error removing profile')
      }),
    )
  }

  create(org_id: number, profile: ColumnMappingProfile): Observable<ColumnMappingProfileUpdateResponse> {
    const url = `/api/v3/column_mapping_profiles/?organization_id=${org_id}`
    return this._httpClient.post<ColumnMappingProfileUpdateResponse>(url, { ...profile }).pipe(
      tap(() => { this._snackBar.success('Profile created successfully') }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error creating profile')
      }),
    )
  }

  export(org_id: number, profile_id: number) {
    const url = `/api/v3/column_mapping_profiles/${profile_id}/csv/?organization_id=${org_id}`
    return this._httpClient.get(url, { responseType: 'text' }).pipe(
      map((response) => {
        return new Blob([response], { type: 'text/csv;charset: utf-8' })
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error retrieving csv')
      }),
    )
  }

  suggestions(org_id: number, headers: string[]) {
    const url = `/api/v3/column_mapping_profiles/suggestions/?organization_id=${org_id}`
    return this._httpClient.post<ColumnMappingSuggestionResponse>(url, { headers }).pipe(
      map((response) => {
        return response.data
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error retrieving suggestions')
      }),
    )
  }
}
