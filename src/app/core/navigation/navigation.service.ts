import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { ReplaySubject, tap } from 'rxjs'
import type { Navigation } from 'app/core/navigation/navigation.types'

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private _httpClient = inject(HttpClient)
  private _navigation: ReplaySubject<Navigation> = new ReplaySubject<Navigation>(1)

  /**
   * Getter for navigation
   */
  get navigation$(): Observable<Navigation> {
    return this._navigation.asObservable()
  }

  /**
   * Get all navigation data
   */
  get(): Observable<Navigation> {
    return this._httpClient.get<Navigation>('api/common/navigation').pipe(
      tap((navigation) => {
        this._navigation.next(navigation)
      }),
    )
  }
}
