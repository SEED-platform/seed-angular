import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { ReplaySubject, tap } from 'rxjs'
import type { OrganizationsResponse } from './organization.types'

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private _httpClient = inject(HttpClient)
  private _organizations: ReplaySubject<OrganizationsResponse> = new ReplaySubject<OrganizationsResponse>(1)
  organizations$ = this._organizations.asObservable()

  get(): Observable<OrganizationsResponse> {
    return this._get(false)
  }

  getBrief(): Observable<OrganizationsResponse> {
    return this._get(true)
  }

  _get(brief = false): Observable<OrganizationsResponse> {
    const url = brief ? '/api/v3/organizations/?brief=true' : '/api/v3/organizations/'
    return this._httpClient.get<OrganizationsResponse>(url).pipe(
      tap((organizations) => {
        this._organizations.next(organizations)
      }),
    )
  }
}
