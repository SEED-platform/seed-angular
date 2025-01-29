import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { map, ReplaySubject, tap } from 'rxjs'
import type { SetDefaultOrganizationResponse, User } from 'app/core/user/user.types'


@Injectable({ providedIn: 'root' })
export class UserService {
  private _httpClient = inject(HttpClient)
  private _user: ReplaySubject<User> = new ReplaySubject<User>(1)

  /**
   * Setter & getter for user
   */
  set user(value: User) {
    // Store the value
    this._user.next(value)
  }

  get user$(): Observable<User> {
    return this._user.asObservable()
  }

  /**
   * Get the current signed-in user data
   */
  get(): Observable<User> {
    return this._httpClient.get<User>('/api/v3/users/current/').pipe(
      tap((user: User) => {
        this._user.next(user)
      }),
    )
  }

  /**
   * Update the user
   */
  update(user: User): Observable<any> {
    return this._httpClient.patch<User>('api/common/user', { user }).pipe(
      map((response) => {
        this._user.next(response)
      }),
    )
  }

  /**
   * Set default org
   */
  update_default_organization(user: User, organization_id: number): Observable<SetDefaultOrganizationResponse> {
    return this._httpClient.put<SetDefaultOrganizationResponse>(`/api/v3/users/${user.id}/default_organization/?organization_id=${organization_id}`, {}).pipe(
      tap(() => {
        this.get().subscribe(() => {
          // success
        })
      }),
    )
  }
}
