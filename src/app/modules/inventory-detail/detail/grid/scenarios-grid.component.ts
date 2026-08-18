import { CommonModule } from '@angular/common'
import type { OnChanges, SimpleChanges } from '@angular/core'
import { Component, EventEmitter, inject, Input, Output } from '@angular/core'
import { AgGridAngular } from 'ag-grid-angular'
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import type { Scenario } from '@seed/api'
import { ScenarioService } from '@seed/api'
import { MaterialImports } from '@seed/materials'
import { ConfigService } from '@seed/services'
import type { ViewResponse } from 'app/modules/inventory/inventory.types'

type FieldType = 'annual_electricity_savings' | 'annual_peak_electricity_reduction' | 'annual_natural_gas_savings'

@Component({
  selector: 'seed-inventory-detail-scenarios-grid',
  templateUrl: './scenarios-grid.component.html',
  imports: [CommonModule, AgGridAngular, MaterialImports],
})
export class ScenariosGridComponent implements OnChanges {
  @Input() orgId: number
  @Input() view: ViewResponse
  @Input() viewId: number
  @Output() refreshView = new EventEmitter<null>()
  private _configService = inject(ConfigService)
  private _scenarioService = inject(ScenarioService)
  columnDefs: ColDef[] = []
  measureColumnDefs: ColDef[] = [
    { field: 'category', headerName: 'Category', flex: 1 },
    { field: 'display_name', headerName: 'Name', flex: 2 },
    { field: 'implementation_status', headerName: 'Status', flex: 1 },
    { field: 'description', headerName: 'Description', flex: 2 },
  ]
  gridApi: GridApi
  gridTheme$ = this._configService.gridTheme$
  scenarios: Scenario[]
  rowDataEntries: { date: string; rawDate: number; rowData: Scenario[] }[] = []

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.view) {
      this.initScenarios()
    }
  }

  initScenarios() {
    this.scenarios = this.view.state.scenarios
    this.setColumnDefs()
    this.setGrid()
  }

  setColumnDefs() {
    this.columnDefs = [
      { field: 'id', hide: true },
      { field: 'name', headerName: 'Scenario' },
      {
        field: 'annual_electricity_savings',
        headerName: 'Electricity Savings (kBtu)',
        valueGetter: this.withDefault('annual_electricity_savings'),
      },
      {
        field: 'annual_peak_electricity_reduction',
        headerName: 'Peak Reduction (kW)',
        valueGetter: this.withDefault('annual_peak_electricity_reduction'),
      },
      {
        field: 'annual_natural_gas_savings',
        headerName: 'Gas Savings (kBTU)',
        valueGetter: this.withDefault('annual_natural_gas_savings'),
      },
      {
        headerName: 'Status of Measures',
        valueGetter: ({ data }: { data: Scenario }) => `${data?.measures?.length || 0} Proposed`,
      },
      { field: 'actions', headerName: 'Actions', cellRenderer: this.actionRenderer, width: 90 },
    ]
  }

  withDefault = (field: FieldType) => {
    return ({ data }: { data: Scenario }): unknown => data?.[field] ?? 'N/A'
  }

  actionRenderer = () => {
    return '<span class="material-icons mt-2  cursor-pointer text-secondary">clear</span>'
  }

  deleteScenario(id: number, name: string): void {
    if (confirm(`Are you sure you want to delete scenario "${name}"?`)) {
      this._scenarioService.deleteScenario(this.orgId, this.viewId, id).subscribe(() => {
        this.refreshView.emit(null)
      })
    }
  }

  setGrid() {
    for (const history of this.view.history) {
      const date = new Date(history.date_edited).toLocaleString('en-US', {})
      const entry = { date, rawDate: history.date_edited, rowData: history.state.scenarios }
      if (entry.rowData?.length) this.rowDataEntries.push(entry)
    }
    this.rowDataEntries.sort((a, b) => b.rawDate - a.rawDate)
  }

  onGridReady(agGrid: GridReadyEvent) {
    this.gridApi = agGrid.api
    this.gridApi.sizeColumnsToFit()
  }

  getMeasuresHeight(measures: Record<string, unknown>[]): number {
    return Math.min((measures?.length ?? 0) * 42 + 52, 300)
  }
}
