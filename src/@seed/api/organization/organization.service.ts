import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { map, ReplaySubject, tap } from 'rxjs'
import { naturalSort } from '../../utils'
import type { BriefOrganization, Organization, OrganizationsResponse } from './organization.types'

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private _httpClient = inject(HttpClient)
  private _organizations: ReplaySubject<BriefOrganization[]> = new ReplaySubject<BriefOrganization[]>(1)
  organizations$ = this._organizations.asObservable()

  get(): Observable<Organization[]> {
    return this._get(false) as Observable<Organization[]>
  }

  getBrief(): Observable<BriefOrganization[]> {
    return this._get(true)
  }

  private _get(brief = false): Observable<(BriefOrganization | Organization)[]> {
    const url = brief ? '/api/v3/organizations/?brief=true' : '/api/v3/organizations/'
    return this._httpClient.get<OrganizationsResponse>(url).pipe(
      map(({ organizations }) => {
        return organizations.toSorted((a, b) => naturalSort(a.name, b.name))
      }),
      tap((organizations) => {
        // TODO not sure if we actually want to cache this in the replaySubject
        if (brief) {
          this._organizations.next(organizations)
        }
      }),
    )
  }
}
