import { CommonModule } from '@angular/common'
import type { OnChanges, SimpleChanges } from '@angular/core'
import { Component, EventEmitter, inject, Input, Output } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatSelectModule } from '@angular/material/select'
import type { ReadingInterval } from '@seed/api/sensor'
import { type SensorReading, SensorService, type SensorUsage } from '@seed/api/sensor'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { CellClickedEvent, ColDef, GridApi, GridReadyEvent, Theme } from 'ag-grid-community'
import type { Pagination } from 'app/modules/inventory/inventory.types'
import { InventoryGridControlsComponent } from 'app/modules/inventory-list'
import type { Observable } from 'rxjs'

@Component({
  selector: 'seed-inventory-detail-sensor-readings-grid',
  templateUrl: './sensor-readings-grid.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    CommonModule,
    MatCheckboxModule,
    MatDividerModule,
    MatIconModule,
    MatSelectModule,
    InventoryGridControlsComponent,
    FormsModule,
  ],
})
export class SensorReadingsGridComponent implements OnChanges {
  @Input() usage: SensorUsage
  @Input() gridTheme$: Observable<Theme>
  @Input() excludedSensorIds: number[] = []
  @Input() orgId: number
  @Input() viewId: number
  @Output() occupiedHoursOnlyChange = new EventEmitter<boolean>()
  @Output() intervalChange = new EventEmitter<ReadingInterval>()
  private _sensorService = inject(SensorService)
  gridApi: GridApi
  gridHeight = 0
  columnDefs: ColDef[]
  interval: ReadingInterval = 'Exact'
  occupiedHoursOnly = false
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

  // intervalChange(interval) {
  //   console.log('child Interval changed:', this.interval)
  //   this.intervalChanged.emit(this.interval)
  // }

  // occupiedHoursOnlyChange() {
  //   console.log('child occupiedHoursOnly changed:', this.occupiedHoursOnly)
  //   this.occupiedHoursOnlyChanged.emit(this.occupiedHoursOnly)
  // }
}
