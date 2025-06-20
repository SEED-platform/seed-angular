import { CommonModule } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatCardModule } from '@angular/material/card'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import type { AnalysisOutputFile, AnalysisServiceType } from '@seed/api/analysis'
import { SafeUrlPipe } from '@seed/pipes/safe-url/safe-url.pipe'
import { ConfigService } from '@seed/services'
import { AgGridAngular } from 'ag-grid-angular'
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'

@Component({
  selector: 'seed-analysis-results-modal',
  templateUrl: './results-modal.component.html',
  imports: [
    AgGridAngular,
    CommonModule,
    MatIconModule,
    MatDividerModule,
    MatCardModule,
    SafeUrlPipe,
  ],
})
export class ResultsModalComponent implements OnInit {
  private _dialog = inject(MatDialogRef)
  private _configService = inject(ConfigService)
  data = inject(MAT_DIALOG_DATA) as {
    parsedResults: Record<string, unknown>;
    outputFiles: AnalysisOutputFile[];
    service: AnalysisServiceType;
  }
  rowData: Record<string, unknown>[]
  gridTheme$ = this._configService.gridTheme$
  gridApi: GridApi
  columnDefs: ColDef[] = [
    { field: 'key', headerName: 'Key' },
    { field: 'value', headerName: 'Value', cellDataType: 'text' },
  ]

  ngOnInit() {
    console.log('data', this.data)
    this.formatResults()
  }

  formatResults() {
    const { parsedResults } = this.data
    this.rowData = Object.entries(parsedResults).map(([key, value]) => ({ key, value }))
  }

  onGridReady(event: GridReadyEvent) {
    this.gridApi = event.api
    this.gridApi.sizeColumnsToFit()
  }

  resizeIframe(event: Event) {
    const iframe = event.target as HTMLIFrameElement
    iframe.style.height = '500px'
    // iframe.style.height = `${iframe.contentWindow?.document.documentElement.scrollHeight}px`
  }

  dismiss() {
    this._dialog.close()
  }
}
