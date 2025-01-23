import { inject, Injectable } from '@angular/core'
import { Router } from '@angular/router'
import type { Observable } from 'rxjs'
import { of } from 'rxjs'
import { delay } from 'rxjs/operators'
import type { Organization } from './organizations.types'

@Injectable({ providedIn: 'root' })
export class OrganizationsService {
  private _router = inject(Router)

  // mock data
  private ORGANIZATIONS_DATA = [
    {
      id: 1,
      name: 'Organization 1',
      propertiesByCycle: [
        { cycle: '2000 Calendar', count: 10 },
        { cycle: '2001 Calendar', count: 20 },
      ],
      taxLotsByCycle: [
        { cycle: '2000 Calendar', count: 11 },
      ],
      role: 'Owner',
      owners: ['Owner 1', 'Owner 2', 'Owner 3', 'Owner 4'],
    },
    {
      id: 2,
      name: 'Organization 2',
      propertiesByCycle: [
        { cycle: '2020 Calendar', count: 10 },
      ],
      taxLotsByCycle: [],
      role: 'Member',
      owners: ['Owner 3'],
    },
    {
      id: 3,
      name: 'Organization 3',
      propertiesByCycle: [
        { cycle: '2023 Calendar', count: 10 },
        { cycle: '2024 Calendar', count: 20 },
      ],
      taxLotsByCycle: [],
      role: 'Viewer',
      owners: ['Owner 4'],
    },
  ]

  private _org: Organization

  // mock as an observable
  getOrganizations(): Observable<unknown[]> {
    return of(this.ORGANIZATIONS_DATA).pipe(delay(100))
  }

  setOrg(org: Organization) {
    this._org = org
  }

  getOrg() {
    if (!this._org) {
      const segments = this._router.url.toLowerCase().split('/')
      const orgId = segments[segments.indexOf('organizations') + 1]
      this._org = this.ORGANIZATIONS_DATA.find((org) => org.id === Number(orgId))
    }
    return this._org
  }
}
