import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { catchError, distinctUntilChanged, ReplaySubject, switchMap, take, tap, throwError } from 'rxjs'
import type {
  CurrentUser,
  GenerateApiKeyResponse,
  PasswordUpdateRequest,
  PasswordUpdateResponse,
  SetDefaultOrganizationResponse,
  UserUpdateRequest,
} from '@seed/api/user'
import { SnackbarService } from 'app/core/snackbar/snackbar.service'

@Injectable({ providedIn: 'root' })
export class UserService {
  private _httpClient = inject(HttpClient)
  private _currentOrganizationId = new ReplaySubject<number>(1)
  private _currentUser = new ReplaySubject<CurrentUser>(1)
  private _snackBar = inject(SnackbarService)
  currentOrganizationId$ = this._currentOrganizationId.asObservable().pipe(distinctUntilChanged())
  currentUser$ = this._currentUser.asObservable()

  /**
   * Get the current signed-in user data
   */
  getCurrentUser(): Observable<CurrentUser> {
    return this._httpClient.get<CurrentUser>('/api/v3/users/current/').pipe(
      tap((user) => {
        this._currentUser.next(user)
        this._currentOrganizationId.next(user.org_id)
      }),
    )
  }

  /**
   * Set default org
   */
  setDefaultOrganization(organizationId: number): Observable<SetDefaultOrganizationResponse> {
    return this.currentUser$.pipe(
      take(1),
      switchMap(({ id: userId }) => {
        return this._httpClient.put<SetDefaultOrganizationResponse>(
          `/api/v3/users/${userId}/default_organization/?organization_id=${organizationId}`,
          {},
        )
      }),
      tap(() => {
        // Refresh user info after changing the organization
        this.getCurrentUser().subscribe()
      }),
    )
  }

  /**
   * Update user
   */
  updateUser(userId: number, params: UserUpdateRequest): Observable<CurrentUser> {
    return this._httpClient.put<CurrentUser>(`api/v3/users/${userId}/`, params)
      .pipe(
        tap((user) => {
          this._currentUser.next(user)
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error occurred while updating user:', error.error)
          this._snackBar.alert(error?.message || 'Error updating user', 'OK', true)
          return throwError(() => new Error(error?.message || 'Error updating user'))
        }),
      )
  }

  /**
   * Update user role
   */
  updateUserRole(userId: number, orgId: number, role: string): Observable<{ status: string }> {
    const url = `api/v3/users/${userId}/role/?organization_id=${orgId}`
    return this._httpClient.put<{ status: string }>(url, { role })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error occurred while updating user:', error.error)
          this._snackBar.alert(error?.message || 'Error updating user', 'OK', true)
          return throwError(() => new Error(error?.message || 'Error fetching cycles'))
        }),
      )
  }

  updateUserAccessLevelInstance(userId: number, orgId: number, accessLevelInstanceId: number): Observable<{ status: string }> {
    console.log('update access level instance', userId, orgId, accessLevelInstanceId)
    const url = `/api/v3/users/${userId}/access_level_instance/?organization_id=${orgId}`
    return this._httpClient.put<{ status: string }>(url, { access_level_instance_id: accessLevelInstanceId })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error occurred while updating user:', error.error)
          this._snackBar.alert(error?.message || 'Error updating user', 'OK', true)
          return throwError(() => new Error(error?.message || 'Error fetching cycles'))
        }),
      )
  }

  /**
   * Update user
   */
  updatePassword(params: PasswordUpdateRequest): Observable<PasswordUpdateResponse> {
    return this.currentUser$.pipe(
      take(1),
      switchMap(({ id: userId }) => {
        return this._httpClient.put<PasswordUpdateResponse>(`api/v3/users/${userId}/set_password/`, params)
      }),
      tap(() => {
        this.getCurrentUser().subscribe()
      }),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error)
      }),
    )
  }

  /**
   * Generate API Key
   */
  generateApiKey(): Observable<GenerateApiKeyResponse> {
    return this.currentUser$.pipe(
      take(1),
      switchMap(({ id: userId }) => {
        return this._httpClient.post<GenerateApiKeyResponse>(`api/v3/users/${userId}/generate_api_key/`, {})
      }),
      tap(() => {
        // Refresh user info after changing the API key
        this.getCurrentUser().subscribe()
      }),
    )
  }
}
