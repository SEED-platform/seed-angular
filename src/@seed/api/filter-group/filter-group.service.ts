import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { BehaviorSubject, catchError, map, take, tap } from 'rxjs'
import { ErrorService } from '@seed/services'
import { naturalSort } from '@seed/utils'
import { UserService } from '../user'
import type { FilterGroup, FilterGroupInventoryType, FilterGroupsResponse } from './filter-group.types'

@Injectable({ providedIn: 'root' })
export class FilterGroupService {
  private _errorService = inject(ErrorService)
  private _filterGroups = new BehaviorSubject<FilterGroup[]>([])
  private _httpClient = inject(HttpClient)
  private _userService = inject(UserService)

  filterGroups$ = this._filterGroups.asObservable()

  constructor() {
    this._userService.currentOrganizationId$
      .pipe(
        tap((orgId) => {
          this.list(orgId, 'Property')
        }),
      )
      .subscribe()
  }

  list(orgId: number, inventoryType: FilterGroupInventoryType = 'Property') {
    const url = `/api/v3/filter_groups/?organization_id=${orgId}&inventory_type=${inventoryType}`
    this._httpClient
      .get<FilterGroupsResponse>(url)
      .pipe(
        take(1),
        map(({ data }) => {
          const filterGroups = data.toSorted((a, b) => naturalSort(a.name, b.name))
          this._filterGroups.next(filterGroups)
          return filterGroups
        }),
        catchError((error: HttpErrorResponse) => {
          return this._errorService.handleError(error, 'Error fetching filter groups')
        }),
      )
      .subscribe()
  }
}
