import { CommonModule } from '@angular/common'
import type { OnChanges, SimpleChanges } from '@angular/core'
import { Component, inject, Input } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { ConfigService } from '@seed/services'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { CellClickedEvent, ColDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community'
import type { Scenario, ViewResponse } from '../../inventory.types'

@Component({
  selector: 'seed-inventory-detail-scenarios-grid',
  templateUrl: './scenarios-grid.component.html',
  imports: [
    CommonModule,
    AgGridAngular,
    AgGridModule,
    MatIconModule,
  ],
})
export class ScenariosGridComponent implements OnChanges {
  @Input() view: ViewResponse
  @Input() viewId: number
  private _configService = inject(ConfigService)
  columnDefs: ColDef[] = []
  gridApi: GridApi
  gridTheme$ = this._configService.gridTheme$
  gridOptions: GridOptions
  scenarios: Scenario[]
  rowData: Scenario[]

  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes)
    this.initScenarios()
  }

  initScenarios() {
    this.scenarios = this.view.state.scenarios
    this.setColumnDefs()
    this.setGrid()
  }

  setColumnDefs() {
    this.columnDefs = [
      { headerName: 'Actions', cellRenderer: this.actionRenderer },
      { field: 'id', hide: true },
      { field: 'name', headerName: 'Scenario' },
      {
        field: 'annual_electricity_savings',
        headerName: 'Electricity Savings (kBtu)',
        valueGetter: this.withDefault('annual_electricity_savings'),
      },
      { field: 'annual_peak_electricity_reduction', headerName: 'Peak Reduction (kW)', valueGetter: this.withDefault('annual_peak_electricity_reduction') },
      { field: 'annual_natural_gas_savings', headerName: 'Gas Savings (kBTU)', valueGetter: this.withDefault('annual_natural_gas_savings') },
      {
        headerName: 'Status of Measures',
        valueGetter: ({ data }: { data: Scenario }) => `${data.measures?.length || 0} Proposed`,
      },
    ]
    this.gridOptions = {}
    // this.gridOptions = {
    //   masterDetail: true,
    //   columnDefs: this.columnDefs,
    //   detailCellRendererParams: {
    //     getDetailRowData: (params: { data: Scenario; successCallback: (rowData: unknown[]) => void }) => {
    //       params.successCallback(params.data.measures)
    //     },
    //     detailGridOptions: {
    //       columnDefs: [
    //         { field: 'category', headerName: 'Category' },
    //         { field: 'name', headerName: 'Name' },
    //         { field: 'recommended', headerName: 'Recommended' },
    //         { field: 'status', headerName: 'Status' },
    //       ],
    //     },
    //   },
    // }
  }

  withDefault = (field: string) => {
    return ({ data }: { data: Scenario }) => data?.[field] ?? 'N/A'
  }

  actionRenderer = () => {
    return '<span class="material-icons mt-2 action-icon cursor-pointer">clear</span>'
  }

  setGrid() {
    this.rowData = this.scenarios.map((s) => ({ ...s, expanded: false }))
  }

  onGridReady(agGrid: GridReadyEvent) {
    this.gridApi = agGrid.api
    this.gridApi.sizeColumnsToFit()
  }

  get gridHeight() {
    const headerHeight = 50
    const gridHeight = this.rowData.length * 42 + headerHeight
    return Math.min(gridHeight, 500)
  }
}
