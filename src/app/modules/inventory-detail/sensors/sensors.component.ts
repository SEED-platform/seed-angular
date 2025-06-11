import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { ActivatedRoute } from '@angular/router'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { Observable } from 'rxjs'
import { Subject, switchMap, takeUntil, tap } from 'rxjs'
import { OrganizationService } from '@seed/api/organization'
import type { DataLogger, ReadingInterval, Sensor, SensorUsage, SensorUsageRequestConfig } from '@seed/api/sensor';
import { SensorService } from '@seed/api/sensor'
import { UserService } from '@seed/api/user'
import { PageComponent } from '@seed/components'
import { ConfigService } from '@seed/services'
import { DataLoggersGridComponent } from './data-loggers/data-loggers-grid.component'
import { FormModalComponent } from './data-loggers/modal/form-modal.component'
import { SensorReadingsGridComponent } from './sensor-readings/sensor-readings-grid.component'
import { SensorsGridComponent } from './sensors/sensors-grid.component'

@Component({
  selector: 'seed-inventory-detial-sensors',
  templateUrl: './sensors.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    CommonModule,
    DataLoggersGridComponent,
    MatIconModule,
    PageComponent,
    SensorsGridComponent,
    SensorReadingsGridComponent,
  ],
})
export class SensorsComponent implements OnDestroy, OnInit {
  private _configService = inject(ConfigService)
  private _dialog = inject(MatDialog)
  private _organizationService = inject(OrganizationService)
  private _route = inject(ActivatedRoute)
  private _sensorService = inject(SensorService)
  private _userService = inject(UserService)
  private readonly _unsubscribeAll$ = new Subject<void>()

  dataLoggers: DataLogger[]
  excludedSensorIds: number[] = []
  excludedDataLoggerIds: number[] = []
  gridTheme$ = this._configService.gridTheme$
  interval: ReadingInterval = 'Exact'
  showOnlyOccupiedReadings = false
  orgId: number
  viewId: number
  viewDisplayField$: Observable<string>
  sensors: Sensor[]
  usage: SensorUsage

  ngOnInit() {
    this.getUrlParams().pipe(
      takeUntil(this._unsubscribeAll$),
      switchMap(() => this.getOrg()),
      tap(() => { this.setStreams() }),
    ).subscribe()
  }

  getUrlParams() {
    return this._route.parent.paramMap.pipe(
      tap((params) => {
        this.viewId = parseInt(params.get('id'))
        this.viewDisplayField$ = this._organizationService.getViewDisplayField(this.viewId, 'properties')
      }),
    )
  }

  getOrg() {
    return this._userService.currentOrganizationId$.pipe(
      tap((orgId) => { this.orgId = orgId }),
    )
  }

  setStreams() {
    this._sensorService.listDataLoggers(this.orgId, this.viewId)
    this._sensorService.listSensors(this.orgId, this.viewId)
    this._sensorService.listSensorUsage(this.orgId, this.viewId)

    this._sensorService.dataLoggers$.subscribe((dataLoggers) => this.dataLoggers = dataLoggers)
    this._sensorService.sensors$.subscribe((sensors) => this.sensors = sensors)
    this._sensorService.usage$.subscribe((usage) => this.usage = usage)
  }

  createDataLogger = () => {
    const existingDisplayNames = this.dataLoggers.map((dl) => dl.display_name)
    this._dialog.open(FormModalComponent, {
      width: '40rem',
      data: { orgId: this.orgId, viewId: this.viewId, dataLogger: null, existingDisplayNames },
    })
  }

  onDataLoggerExcludedIdsChange = (excludedIds: number[]) => {
    // unselect all sensors attached to an excluded data logger
    this.excludedDataLoggerIds = excludedIds
  }

  onSensorExcludedIdsChange = (excludedIds: number[]) => {
    this.excludedSensorIds = excludedIds
    const config = {
      excluded_sensor_ids: excludedIds,
    }
    this._sensorService.listSensorUsage(this.orgId, this.viewId, config)
  }

  onOccupiedOnlyChanged(value: boolean) {
    this.showOnlyOccupiedReadings = value
    this._sensorService.listSensorUsage(this.orgId, this.viewId, this.getConfig())
  }

  intervalChanged(interval: ReadingInterval) {
    this.interval = interval
    this._sensorService.listSensorUsage(this.orgId, this.viewId, this.getConfig())
  }

  getConfig(): SensorUsageRequestConfig {
    return {
      interval: this.interval,
      showOnlyOccupiedReadings: this.showOnlyOccupiedReadings,
      excluded_sensor_ids: this.excludedSensorIds,
    }
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
