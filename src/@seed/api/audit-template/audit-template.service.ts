import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { catchError, map, ReplaySubject, Subject, takeUntil } from 'rxjs'
import { ErrorService } from '@seed/services/error/error.service'
import { UserService } from '../user'
import type {
  AuditTemplateConfig,
  AuditTemplateConfigCreateResponse,
  AuditTemplateConfigResponse,
  AuditTemplateReportType,
} from './audit-template.types'

@Injectable({ providedIn: 'root' })
export class AuditTemplateService {
  private _httpClient = inject(HttpClient)
  private _userService = inject(UserService)
  private _errorService = inject(ErrorService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _reportTypes = new ReplaySubject<AuditTemplateReportType[]>(1)
  private _auditTemplateConfig = new ReplaySubject<AuditTemplateConfig>(1)
  reportTypes$ = this._reportTypes.asObservable()
  auditTemplateConfig$ = this._auditTemplateConfig.asObservable()

  constructor() {
    this._reportTypes.next([
      { name: 'ASHRAE Level 2 Report' },
      { name: 'Atlanta Report' },
      { name: 'Baltimore Energy Audit Report' },
      { name: 'Berkeley Report' },
      { name: 'BRICR Phase 0/1' },
      { name: 'Brisbane Energy Audit Report' },
      { name: 'DC BEPS Energy Audit Report' },
      { name: 'DC BEPS RCx Report' },
      { name: 'Demo City Report' },
      { name: 'Denver Energy Audit Report' },
      { name: 'EE-RLF Template' },
      { name: 'Energy Trust of Oregon Report' },
      { name: 'Los Angeles Report' },
      { name: 'Minneapolis Energy Evaluation Report' },
      { name: 'New York City Energy Efficiency Report' },
      { name: 'Office of Recapitalization Energy Audit Report' },
      { name: 'Open Efficiency Report' },
      { name: 'San Francisco Report' },
      { name: 'St. Louis RCx Report' },
      { name: 'St. Louis Report' },
      { name: 'WA Commerce Clean Buildings - Form D Report' },
      { name: 'WA Commerce Grants Report' },
    ])
    this._userService.currentOrganizationId$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((organizationId) => {
      this.getConfigs(organizationId).subscribe()
    })
  }

  getConfigs(org_id: number): Observable<AuditTemplateConfig> {
    const url = `/api/v3/audit_template_configs/?organization_id=${org_id}`
    return this._httpClient.get<AuditTemplateConfigResponse>(url).pipe(
      map((response) => {
        this._auditTemplateConfig.next(response.data[0])
        return response.data[0]
      }),
      catchError((error: HttpErrorResponse) => {
        // TODO need to figure out error handling
        return this._errorService.handleError(error, 'Error fetching audit template configs')
      }),
    )
  }

  create(auditTemplateConfig: AuditTemplateConfig): Observable<AuditTemplateConfig> {
    const url = `/api/v3/audit_template_configs/?organization_id=${auditTemplateConfig.organization}`
    return this._httpClient.post<AuditTemplateConfigCreateResponse>(url, { ...auditTemplateConfig }).pipe(
      map((r) => {
        this._auditTemplateConfig.next(r.data)
        return r.data
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error updating Audit Template Config')
      }),
    )
  }

  update(auditTemplateConfig: AuditTemplateConfig): Observable<AuditTemplateConfig | null> {
    const url = `/api/v3/audit_template_configs/${auditTemplateConfig.id}/?organization_id=${auditTemplateConfig.organization}`
    return this._httpClient.put<AuditTemplateConfigResponse>(url, { ...auditTemplateConfig }).pipe(
      map((r) => {
        this._auditTemplateConfig.next(r.data[0])
        return r.data[0]
      }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error updating Audit Template Config')
      }),
    )
  }
}
