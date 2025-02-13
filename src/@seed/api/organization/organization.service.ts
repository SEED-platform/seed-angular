import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { catchError, map, of, ReplaySubject, Subject, takeUntil, tap } from 'rxjs'
import { SnackbarService } from 'app/core/snackbar/snackbar.service'
import { naturalSort } from '../../utils'
import { UserService } from '../user'
import type {
  BriefOrganization,
  Organization,
  OrganizationResponse,
  OrganizationSettings,
  OrganizationsResponse,
} from './organization.types'

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private _httpClient = inject(HttpClient)
  private _userService = inject(UserService)
  private _organizations = new ReplaySubject<BriefOrganization[]>(1)
  private _currentOrganization = new ReplaySubject<Organization>(1)
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _snackBar = inject(SnackbarService)

  organizations$ = this._organizations.asObservable()
  currentOrganization$ = this._currentOrganization.asObservable()

  constructor() {
    // Fetch current org data whenever user org id changes
    this._userService.currentOrganizationId$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((organizationId) => {
      this.getById(organizationId).subscribe()
    })
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
        console.error('Error occurred fetching organization: ', error.error)
        return of({} as Organization)
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
        console.error('Error occurred fetching organization: ', error.error)
        this._snackBar.alert(`An error occurred updating the organization: ${error.error}`)
        return of(null)
      }),
    )
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
