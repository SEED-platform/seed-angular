import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { ErrorService } from '@seed/services'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import { BehaviorSubject, catchError, Subject, takeUntil, tap } from 'rxjs'
import { OrganizationService } from '../organization'
import type { Meter, MeterUsage } from './meter.types'

@Injectable({ providedIn: 'root' })
export class MeterService {
  private _errorService = inject(ErrorService)
  private _meters = new BehaviorSubject<Meter[]>([])
  private _meterReadings = new BehaviorSubject<MeterUsage>(null)
  private _httpClient = inject(HttpClient)
  private _organizationService = inject(OrganizationService)
  private _snackBar = inject(SnackBarService)
  private readonly _unsubscribeAll$ = new Subject<void>()

  meters$ = this._meters.asObservable()
  meterReadings$ = this._meterReadings.asObservable()
  orgId: number

  constructor() {
    this._organizationService.currentOrganization$
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe(({ org_id }) => this.orgId = org_id)
  }

  list(orgId: number, viewId: number) {
    const url = `/api/v3/properties/${viewId}/meters/?organization_id=${orgId}`
    this._httpClient.get<Meter[]>(url).pipe(
      tap((meters) => { this._meters.next(meters) }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching meters')
      }),
    ).subscribe()
  }

  listReadings(orgId: number, viewId: number, interval: string, excluded_meter_ids: number[] = []) {
    const url = `/api/v3/properties/${viewId}/meter_usage/?organization_id=${orgId}`
    const body = { interval, excluded_meter_ids }
    return this._httpClient.post<MeterUsage>(url, body).pipe(
      tap((readings) => { this._meterReadings.next(readings) }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching meter usage')
      }),
    ).subscribe()
  }
}
