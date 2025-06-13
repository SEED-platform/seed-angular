import { CommonModule } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject, Input } from '@angular/core'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import type { Dataset } from '@seed/api/dataset'
import { ConfigService } from '@seed/services'
import { UploaderService } from '@seed/services/uploader'

@Component({
  selector: 'seed-green-button-step2',
  templateUrl: './green-button-step2.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    CommonModule,
  ],
})
export class GreenButtonStep2Component implements OnInit {
  @Input() file: File
  @Input() data: {
    orgId: number;
    viewId: number;
    fillerCycle: number;
    systemId: number;
    datasets: Dataset[];
  }
  private _uploaderService = inject(UploaderService)
  private _configService = inject(ConfigService)
  readingData: Record<string, unknown>[] = []
  energyData: Record<string, unknown>[] = []
  readingDefs: ColDef[] = []
  energyDefs: ColDef[] = []
  readingGridApi: GridApi
  energyGridApi: GridApi
  gridTheme$ = this._configService.gridTheme$

  ngOnInit() {
    this.getFileData()
    this.setGrid()
  }

  getFileData() {
    console.log('this.file', this.file)
    // this._uploaderService.greenButtonMetersPreview(this.file.file_id, )
  }

  setGrid() {
    this.setColDefs()
    // this.setRowData()
  }

  setColDefs() {
    this.readingDefs = [
      { field: 'usage', headerName: 'GreenButton UsagePoint' },
      { field: 'type', headerName: 'Type' },
      { field: 'incoming', headerName: 'Incoming' },
    ]
    this.energyDefs = [
      { field: 'type', headerName: 'Parsed Type' },
      { field: 'unit', headerName: 'Parsed Unit' },
    ]
  }

  onReadingGridReady(agGrid: GridReadyEvent) {
    this.readingGridApi = agGrid.api
  }

  onEnergyGidReady(agGrid: GridReadyEvent) {
    this.energyGridApi = agGrid.api
  }
}
