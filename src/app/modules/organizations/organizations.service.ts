import { Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { of } from 'rxjs'
import { delay } from 'rxjs/operators'

@Injectable({ providedIn: 'root' })
export class OrganizationsService {
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

  // mock as an observable
  getOrganizations(): Observable<unknown[]> {
    return of(this.ORGANIZATIONS_DATA).pipe(delay(500))
  }
}
