import { CommonModule } from '@angular/common'
import type { OnChanges, SimpleChanges } from '@angular/core'
import { Component, inject, Input } from '@angular/core'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatSelectModule } from '@angular/material/select'
import type { SensorUsageRequestConfig} from '@seed/api/sensor'
import { type SensorReading, SensorService, type SensorUsage } from '@seed/api/sensor'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { CellClickedEvent, ColDef, GridApi, GridReadyEvent, Theme } from 'ag-grid-community'
import { InventoryGridControlsComponent } from 'app/modules/inventory-list'
import type { Observable } from 'rxjs'
import type { Pagination } from 'app/modules/inventory/inventory.types'

@Component({
  selector: 'seed-inventory-detail-sensor-readings-grid',
  templateUrl: './sensor-readings-grid.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    CommonModule,
    MatDividerModule,
    MatIconModule,
    MatSelectModule,
    InventoryGridControlsComponent,
  ],
})
export class SensorReadingsGridComponent implements OnChanges {
  @Input() usage: SensorUsage
  @Input() gridTheme$: Observable<Theme>
  @Input() excludedSensorIds: number[] = []
  @Input() orgId: number
  @Input() viewId: number
  private _sensorService = inject(SensorService)
  gridApi: GridApi
  gridHeight = 0
  columnDefs: ColDef[]
  interval: 'Exact' | 'Year' | 'Month' = 'Exact'
  readings: SensorReading[] = []
  pagination: Pagination
  gridOptions = {
    paginationPageSizeSelector: [500],
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.usage.currentValue) {
      this.readings = this.usage.readings
      this.pagination = this.usage.pagination
      // this.columnDefs = this.usage.column_defs // would require a new v4 endpoint (just for displayName -> headerName)
      this.columnDefs = this.usage.column_defs.map((cd) => ({
        field: cd.field,
        headerName: cd.displayName,
      }))

      this.getGridHeight()
    }
  }

  getGridHeight() {
    const div = document.querySelector('#content')
    if (!div || !this.readings?.length) return

    const divHeight = div.getBoundingClientRect().height ?? 1
    this.gridHeight = Math.min(this.readings.length * 29 + 97, divHeight * 0.9)
  }

  actionRenderer() {
    return `
      <div class="mt-2 flex gap-2 align-center">
        <span class="material-icons action-icon cursor-pointer text-secondary" title="Edit" data-action="edit">edit</span>
        <span class="material-icons action-icon cursor-pointer text-secondary" title="Delete" data-action="delete">clear</span>
      </div>
    `
  }

  onGridReady(agGrid: GridReadyEvent) {
    this.gridApi = agGrid.api
    this.gridApi.addEventListener('cellClicked', this.onCellClicked.bind(this) as (event: CellClickedEvent) => void)
  }

  onCellClicked(event: CellClickedEvent) {
    if (event.colDef.field !== 'actions') return

    const target = event.event.target as HTMLElement
    const action = target.getAttribute('data-action')

    if (action === 'edit') {
      // Handle edit action
      console.log('Edit action clicked for sensor:', event.data)
    } else if (action === 'delete') {
      // Handle delete action
      console.log('Delete action clicked for sensor:', event.data)
    }
  }

  intervalChange() {
    const config: SensorUsageRequestConfig = {
      excluded_sensor_ids: this.excludedSensorIds,
      interval: this.interval,
    }
    if (this.interval === 'Exact') config.page = this.pagination?.page ?? 1

    this._sensorService.listSensorUsage(this.orgId, this.viewId, config)
  }
}
