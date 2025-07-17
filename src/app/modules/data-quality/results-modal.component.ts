import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { AgGridAngular } from 'ag-grid-angular'
import type { ColDef } from 'ag-grid-community'
import { Subject, takeUntil, tap } from 'rxjs'
import type { DataQualityResults } from '@seed/api/data-quality'
import { DataQualityService } from '@seed/api/data-quality'
import { ConfigService } from '@seed/services'

@Component({
  selector: 'seed-data-quality-results',
  templateUrl: './results-modal.component.html',
  imports: [
    AgGridAngular,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
  ],
})
export class ResultsModalComponent implements OnDestroy, OnInit {
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _configService = inject(ConfigService)
  private _dataQualityService = inject(DataQualityService)
  private _dialog = inject(MatDialogRef<ResultsModalComponent>)

  data = inject(MAT_DIALOG_DATA) as { orgId: number; dqcId: number }

  columnDefs: ColDef[]
  gridTheme$ = this._configService.gridTheme$
  rowData: Record<string, unknown>[] = []
  results: DataQualityResults[] = []

  ngOnInit() {
    this._dataQualityService.getDataQualityResults(this.data.orgId, this.data.dqcId)
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap((results) => {
          this.results = results
          this.setGrid()
        }),
      )
      .subscribe()
  }

  setGrid() {
    if (this.results.length) {
      this.setColumnDefs()
      this.setRowData()
    }
  }

  setColumnDefs() {
    const excludeKeys = ['id', 'data_quality_results']
    const keys = Object.keys(this.results[0]).filter((key) => !excludeKeys.includes(key))
    const matchingColDefs = keys.map((key) => ({
      field: key,
      headerName: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    }))

    const styleLookup: Record<string, string> = {
      error: 'bg-red-600 text-white',
      warning: 'bg-amber-500 text-white',
    }

    const resultDefs = [
      { field: 'table_name', headerName: 'Table' },
      { field: 'formatted_field', headerName: 'Field' },
      { field: 'label', headerName: 'Applied Label' },
      { field: 'severity', hide: true },
      {
        field: 'detailed_message',
        headerName: 'Error Message',
        cellClass: ({ data }: { data: { severity: string } }) => {
          return styleLookup[data?.severity] || ''
        },
      },
    ]

    this.columnDefs = [...matchingColDefs, ...resultDefs]
  }

  setRowData() {
    this.rowData = []
    const excludeKeys = ['id', 'data_quality_results']
    const keys = Object.keys(this.results[0]).filter((key) => !excludeKeys.includes(key))

    for (const result of this.results) {
      const matchingData = this.formatMatchingColData(keys, result)
      for (const dqc of result.data_quality_results) {
        const data = { ...matchingData, ...dqc }
        this.rowData.push(data)
      }
    }
  }

  formatMatchingColData(keys: string[], result: Record<string, unknown>) {
    const data = {}
    for (const key of keys) {
      data[key] = result[key]
    }
    return data
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  dismiss() {
    this._dialog.close()
  }
}
