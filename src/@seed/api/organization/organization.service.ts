import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { catchError, combineLatest, map, of, ReplaySubject, Subject, switchMap, takeUntil, tap } from 'rxjs'
import { ErrorService } from '@seed/services'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import { naturalSort } from '../../utils'
import { UserService } from '../user'
import type {
  AccessLevelNode,
  AccessLevelsByDepth,
  AccessLevelTree,
  AccessLevelTreeResponse,
  BriefOrganization,
  Organization,
  OrganizationResponse,
  OrganizationSettings,
  OrganizationsResponse,
  OrganizationUser,
  OrganizationUsersResponse,
} from './organization.types'

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private _httpClient = inject(HttpClient)
  private _errorService = inject(ErrorService)
  private _snackBar = inject(SnackBarService)
  private _userService = inject(UserService)

  private _organizations = new ReplaySubject<BriefOrganization[]>(1)
  private _currentOrganization = new ReplaySubject<Organization>(1)
  private _organizationUsers = new ReplaySubject<OrganizationUser[]>(1)
  private _accessLevelTree = new ReplaySubject<AccessLevelTree>(1)
  private _accessLevelInstancesByDepth = new ReplaySubject<AccessLevelsByDepth>(1)
  private readonly _unsubscribeAll$ = new Subject<void>()

  organizations$ = this._organizations.asObservable()
  currentOrganization$ = this._currentOrganization.asObservable()
  organizationUsers$ = this._organizationUsers.asObservable()
  accessLevelTree$ = this._accessLevelTree.asObservable()
  accessLevelInstancesByDepth$ = this._accessLevelInstancesByDepth.asObservable()

  constructor() {
    // Fetch current org data whenever user org id changes
    this._userService.currentOrganizationId$
      .pipe(
        takeUntil(this._unsubscribeAll$),
        switchMap((organizationId) => {
          return combineLatest([
            this.getById(organizationId),
            this.getOrganizationUsers(organizationId),
            this.getAccessLevelTree(organizationId),
          ])
        }),
      )
      .subscribe()
  }

  get(organizationId?: number): Observable<Organization[]> | Observable<Organization> {
    if (organizationId) {
      return this.getById(organizationId)
    } else {
      return this._get(false) as Observable<Organization[]>
    }
  }

  getBrief(): Observable<BriefOrganization[]> {
    return this._get(true)
  }

  getById(organizationId: number): Observable<Organization> {
    const url = `/api/v3/organizations/${organizationId}/`
    return this._httpClient.get<OrganizationResponse>(url).pipe(
      map((or) => {
        this._currentOrganization.next(or.organization)
        return or.organization
      }),
      catchError((error: HttpErrorResponse) => {
        // TODO need to figure out error handling
        return this._errorService.handleError(error, 'Error fetching organization')
      }),
    )
  }

  getOrganizationUsers(organizationId: number): Observable<OrganizationUser[]> {
    const url = `/api/v3/organizations/${organizationId}/users/`
    return this._httpClient.get<OrganizationUsersResponse>(url).pipe(
      map((response) => response.users.sort((a, b) => naturalSort(a.last_name, b.last_name))),
      tap((users) => {
        this._organizationUsers.next(users)
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching organization users')
      }),
    )
  }

  getAccessLevelTree(organizationId: number): Observable<AccessLevelTree> {
    const url = `/api/v3/organizations/${organizationId}/access_levels/tree/`
    return this._httpClient.get<AccessLevelTreeResponse>(url).pipe(
      map(({ access_level_names, access_level_tree }) => ({
        accessLevelNames: access_level_names,
        accessLevelTree: access_level_tree,
      })),
      tap((accessLevelTree) => {
        this._accessLevelTree.next(accessLevelTree)
        this._accessLevelInstancesByDepth.next(this._calculateAccessLevelInstancesByDepth(accessLevelTree.accessLevelTree))
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching organization access level tree')
      }),
    )
  }

  deleteOrganizationUser(userId: number, organizationId: number) {
    const url = `/api/v3/organizations/${organizationId}/users/${userId}/remove/`
    return this._httpClient.delete(url).pipe(
      tap(() => {
        this._snackBar.success('Member removed from organization')
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error removing member from organization')
      }),
    )
  }

  copyOrgForUpdate(org: Organization): OrganizationSettings {
    // TODO bad deep copy
    const o = JSON.parse(JSON.stringify(org)) as OrganizationSettings
    o.default_reports_x_axis_options = org.default_reports_x_axis_options.map((option) => option.id)
    o.default_reports_y_axis_options = org.default_reports_y_axis_options.map((option) => option.id)
    return o
  }

  updateSettings(org: Organization): Observable<void> {
    const url = `/api/v3/organizations/${org.id}/save_settings/`
    return this._httpClient.put<OrganizationResponse>(url, { organization: this.copyOrgForUpdate(org) }).pipe(
      tap(() => {
        this._get(true).subscribe()
        this._userService.getCurrentUser().subscribe()
      }),
      map(() => {
        this._snackBar.success('Organization Settings Updated')
        this.getById(org.id).subscribe((o) => {
          return of(o)
        })
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error updating organization settings')
      }),
    )
  }

  /*
   * Transform access level tree into a more usable format
   */
  private _calculateAccessLevelInstancesByDepth(tree: AccessLevelNode[], depth = 0, result: AccessLevelsByDepth = {}): AccessLevelsByDepth {
    if (!tree) return result
    if (!result[depth]) result[depth] = []
    for (const { children, id, name } of tree) {
      result[depth].push({ id, name })
      this._calculateAccessLevelInstancesByDepth(children, depth + 1, result)
    }
    // Sort each depth by name
    for (const depth in result) {
      result[depth].sort((a, b) => naturalSort(a.name, b.name))
    }
    return result
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
