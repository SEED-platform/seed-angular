import { CommonModule } from '@angular/common'
import type { OnChanges, SimpleChanges } from '@angular/core'
import { Component, EventEmitter, Input, Output } from '@angular/core'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { CellClickedEvent, ColDef, GridApi, GridOptions, GridReadyEvent, RowNode, Theme } from 'ag-grid-community'
import type { Observable } from 'rxjs'
import type { Sensor } from '@seed/api/sensor'

@Component({
  selector: 'seed-inventory-detail-sensors-grid',
  templateUrl: './sensors-grid.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    CommonModule,
    MatDividerModule,
    MatIconModule,
  ],
})
export class SensorsGridComponent implements OnChanges {
  @Input() sensors: Sensor[]
  @Input() gridTheme$: Observable<Theme>
  @Input() excludedDataLoggerIds: number[] = []
  @Output() excludedIdsChange = new EventEmitter<number[]>()
  excludedIds: number[] = []
  gridApi: GridApi
  gridHeight = 0
  gridOptions: GridOptions = {
    rowSelection: {
      mode: 'multiRow',
      checkboxes: true,
      headerCheckbox: true,
    },
    onSelectionChanged: () => { this.selectionChanged() },
  }

  columnDefs: ColDef[] = [
    { field: 'id', hide: true },
    { field: 'display_name', headerName: 'Display Name' },
    { field: 'data_logger', headerName: 'Data Logger' },
    { field: 'type', headerName: 'Type' },
    { field: 'location_description', headerName: 'Location Description' },
    { field: 'units', headerName: 'Units' },
    { field: 'column_name', headerName: 'Column Name' },
    { field: 'description', headerName: 'Description' },
    { field: 'actions', headerName: 'Actions', cellRenderer: this.actionRenderer, width: 300 },
  ]

  ngOnChanges(changes: SimpleChanges) {
    if (changes.sensors) {
      this.gridHeight = Math.min(this.sensors.length * 35 + 42, 300)

      setTimeout(() => {
        if (this.gridApi && !this.gridApi.isDestroyed()) {
          this.gridApi?.selectAll()
        }
      }, 100)
    }

    if (changes.excludedDataLoggerIds && this.sensors.length && this.gridApi) {
      const sensorIdsToExclude = this.sensors
        .filter((s) => this.excludedDataLoggerIds.includes(s.data_logger_id))
        .map((s) => s.id)

      this.gridApi.forEachNode((node: RowNode<Sensor>) => {
        if (sensorIdsToExclude.includes(node.data.id)) {
          node.setSelected(false)
        } else {
          node.setSelected(true)
        }
      })
    }
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
    this.gridApi.sizeColumnsToFit()
    this.gridApi.addEventListener('cellClicked', this.onCellClicked.bind(this) as (event: CellClickedEvent) => void)
  }

  onCellClicked(event: CellClickedEvent) {
    if (event.colDef.field !== 'actions') return

    const target = event.event.target as HTMLElement
    const action = target.getAttribute('data-action')
    const { id } = event.data as { id: number }
    const sensor = this.sensors.find((s) => s.id === id)

    if (action === 'edit') {
      this.editSensor(sensor)
    } else if (action === 'delete') {
      this.deleteSensor(sensor)
    }
  }

  editSensor(sensor: Sensor) {
    // Logic to edit the sensor
    console.log('Edit sensor:', sensor)
  }

  deleteSensor(sensor: Sensor) {
    // Logic to delete the sensor
    console.log('Delete sensor:', sensor)
  }

  selectionChanged() {
    const allIds = this.sensors.map((s: Sensor) => s.id)
    const selectedIds = this.gridApi.getSelectedRows().map((r: { id: number }) => r.id)
    const newExcludedIds = allIds.filter((id) => !selectedIds.includes(id))
    if (newExcludedIds.length === this.excludedIds.length) return

    this.excludedIds = newExcludedIds
    this.excludedIdsChange.emit(this.excludedIds)
  }
}
