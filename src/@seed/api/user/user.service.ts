import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { ReplaySubject, switchMap, take, tap } from 'rxjs'
import type { CurrentUser, SetDefaultOrganizationResponse } from '@seed/api/user'

@Injectable({ providedIn: 'root' })
export class UserService {
  private _httpClient = inject(HttpClient)
  private _currentUser: ReplaySubject<CurrentUser> = new ReplaySubject<CurrentUser>(1)
  currentUser$ = this._currentUser.asObservable()

  /**
   * Get the current signed-in user data
   */
  getCurrentUser(): Observable<CurrentUser> {
    return this._httpClient.get<CurrentUser>('/api/v3/users/current/').pipe(
      tap((user: CurrentUser) => {
        this._currentUser.next(user)
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
}
