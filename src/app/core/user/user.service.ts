import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { map, ReplaySubject, tap } from 'rxjs'
import type { User } from 'app/core/user/user.types'

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
    return this._httpClient.get<User>('api/common/user').pipe(
      tap((user) => {
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
}
