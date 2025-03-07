import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { catchError, combineLatest, map, of, ReplaySubject, Subject, switchMap, takeUntil, tap } from 'rxjs'
import { ErrorService } from '@seed/services'
import { SnackbarService } from 'app/core/snackbar/snackbar.service'
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
  private _userService = inject(UserService)
  private _organizations = new ReplaySubject<BriefOrganization[]>(1)
  private _currentOrganization = new ReplaySubject<Organization>(1)
  private _organizationUsers = new ReplaySubject<OrganizationUser[]>(1)
  private _accessLevelTree = new ReplaySubject<AccessLevelTree>(1)
  private _accessLevelInstancesByDepth: AccessLevelsByDepth = {}
  private _errorService = inject(ErrorService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _snackBar = inject(SnackbarService)

  organizations$ = this._organizations.asObservable()
  currentOrganization$ = this._currentOrganization.asObservable()
  organizationUsers$ = this._organizationUsers.asObservable()
  accessLevelTree$ = this._accessLevelTree.asObservable()

  constructor() {
    // Fetch current org data whenever user org id changes
    this._userService.currentOrganizationId$
      .pipe(
        takeUntil(this._unsubscribeAll$),
        switchMap((organizationId) => {
          return combineLatest([
            this.getById(organizationId),
            this.getOrganizationUsers(organizationId),
            this.getOrganizationAccessLevelTree(organizationId),
          ])
        }),
      )
      .subscribe()
  }

  get(org_id?: number): Observable<Organization[]> | Observable<Organization> {
    if (org_id) {
      return this.getById(org_id)
    } else {
      return this._get(false) as Observable<Organization[]>
    }
  }

  getBrief(): Observable<BriefOrganization[]> {
    return this._get(true)
  }

  getById(org_id: number): Observable<Organization> {
    const url = `/api/v3/organizations/${org_id}/`
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

  getOrganizationUsers(orgId: number): Observable<OrganizationUser[]> {
    const url = `/api/v3/organizations/${orgId}/users/`
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

  getOrganizationAccessLevelTree(orgId: number): Observable<AccessLevelTree> {
    const url = `/api/v3/organizations/${orgId}/access_levels/tree`
    return this._httpClient.get<AccessLevelTreeResponse>(url).pipe(
      map((response) => {
        // update response to include more usable accessLevelInstancesByDepth
        this._accessLevelInstancesByDepth = this._calculateAccessLevelInstancesByDepth(response.access_level_tree, 0)
        return {
          accessLevelNames: response.access_level_names,
          accessLevelInstancesByDepth: this._accessLevelInstancesByDepth,
        }
      }),
      tap((accessLevelTree) => {
        this._accessLevelTree.next(accessLevelTree)
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching organization access level tree')
      }),
    )
  }

  deleteOrganizationUser(userId: number, orgId: number) {
    const url = `/api/v3/organizations/${orgId}/users/${userId}/remove/`
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

  resetPasswords(orgId: number): Observable<unknown> {
    const url = `/api/v3/organizations/${orgId}/reset_all_passwords/`
    return this._httpClient.post(url, {}).pipe(
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error resetting passwords')
      }),
    )
  }

  /*
   * Transform access level tree into a more usable format
   */
  private _calculateAccessLevelInstancesByDepth(
    tree: AccessLevelNode[],
    depth: number,
    result: AccessLevelsByDepth = {},
  ): AccessLevelsByDepth {
    if (!tree) return result
    if (!result[depth]) result[depth] = []
    for (const ali of tree) {
      result[depth].push({ id: ali.id, name: ali.name })
      this._calculateAccessLevelInstancesByDepth(ali.children, depth + 1, result)
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
