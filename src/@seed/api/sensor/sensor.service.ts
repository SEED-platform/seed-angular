import type { HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { ErrorService } from '@seed/services'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import { BehaviorSubject, catchError, Subject, takeUntil, tap } from 'rxjs'
import { OrganizationService } from '../organization'
import type { DataLogger, Sensor, SensorUsage, SensorUsageRequestConfig } from './sensor.types'

@Injectable({ providedIn: 'root' })
export class SensorService {
  private _dataLoggers = new BehaviorSubject<DataLogger[]>([])
  private _errorService = inject(ErrorService)
  private _httpClient = inject(HttpClient)
  private _organizationService = inject(OrganizationService)
  private _usage = new BehaviorSubject<SensorUsage>(null)
  private _sensors = new BehaviorSubject<Sensor[]>([])
  private _snackBar = inject(SnackBarService)
  private readonly _unsubscribeAll$ = new Subject<void>()

  dataLoggers$ = this._dataLoggers.asObservable()
  usage$ = this._usage.asObservable()
  sensors$ = this._sensors.asObservable()
  orgId: number

  constructor() {
    this._organizationService.currentOrganization$
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe(({ org_id }) => this.orgId = org_id)
  }

  listDataLoggers(orgId: number, viewId: number) {
    const url = `/api/v3/data_loggers/?organization_id=${orgId}&property_view_id=${viewId}`
    this._httpClient.get<DataLogger[]>(url).pipe(
      tap((dataLoggers) => { this._dataLoggers.next(dataLoggers) }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching data loggers')
      }),
    ).subscribe()
  }

  listSensors(orgId: number, viewId: number) {
    const url = `/api/v3/properties/${viewId}/sensors/?organization_id=${orgId}`
    this._httpClient.get<Sensor[]>(url).pipe(
      tap((sensors) => { this._sensors.next(sensors) }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching sensors')
      }),
    ).subscribe()
  }

  listSensorUsage(orgId: number, viewId: number, config: SensorUsageRequestConfig = {}) {
    const {
      interval = 'Exact',
      showOnlyOccupiedReadings = false,
      page = 1,
      per_page = 500,
      excluded_sensor_ids = [],
    } = config

    const params = new URLSearchParams({
      organization_id: orgId.toString(),
      page: page.toString(),
      per_page: per_page.toString(),
    })

    const url = `/api/v3/properties/${viewId}/sensors/usage/?${params}`
    const body = { interval, showOnlyOccupiedReadings, excluded_sensor_ids }

    this._httpClient.post<SensorUsage>(url, body).pipe(
      tap((usage) => { this._usage.next(usage) }),
      catchError((error: HttpErrorResponse) => {
        return this._errorService.handleError(error, 'Error fetching sensor usage')
      }),
    ).subscribe()
  }
}
