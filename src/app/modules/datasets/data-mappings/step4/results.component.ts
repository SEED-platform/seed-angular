import { CommonModule } from '@angular/common'
import type { OnChanges, OnDestroy, SimpleChanges } from '@angular/core'
import { Component, inject, Input } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { RouterModule } from '@angular/router'
import { AgGridAngular } from 'ag-grid-angular'
import type { ColDef } from 'ag-grid-community'
import { Subject, takeUntil, tap } from 'rxjs'
import type { MatchingResultsResponse } from '@seed/api/mapping'
import { MappingService } from '@seed/api/mapping'
import { ConfigService } from '@seed/services'
import type { InventoryType } from 'app/modules/inventory'

@Component({
  selector: 'seed-match-merge-results',
  templateUrl: './results.component.html',
  imports: [
    AgGridAngular,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBarModule,
    RouterModule,
  ],
})
export class ResultsComponent implements OnChanges, OnDestroy {
  @Input() importFileId: number
  @Input() orgId: number
  @Input() inventoryType: InventoryType
  @Input() inProgress = true

  private _configService = inject(ConfigService)
  private _mappingService = inject(MappingService)
  private readonly _unsubscribeAll$ = new Subject<void>()

  gridTheme$ = this._configService.gridTheme$
  generalData: Record<string, unknown>[]
  generalColDefs: ColDef[] = []
  inventoryColDefs: ColDef[] = [
    { field: 'status', headerName: 'Status' },
    { field: 'count', headerName: 'Count' },
  ]
  matchingResults: MatchingResultsResponse
  propertyData: Record<string, unknown>[] = []
  taxlotData: Record<string, unknown>[] = []
  hasPropertyData = false
  hasTaxlotData = false

  ngOnChanges(changes: SimpleChanges): void {
    console.log('changes', changes)
    if (changes.inProgress.currentValue === false) {
      this.getMatchingResults()
    }
  }

  getMatchingResults() {
    this._mappingService.getMatchingResults(this.orgId, this.importFileId)
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap((results) => { this.setGrid(results) }),
      )
      .subscribe()
  }

  setGrid(results: MatchingResultsResponse) {
    this.matchingResults = results
    this.setGeneralGrid()
    this.setInventoryGrids()
  }

  setGeneralGrid() {
    this.generalColDefs = [
      { field: 'import_file_records', headerName: 'Records in File' },
      { field: 'multiple_cycle_upload', headerName: 'Multi Cycle Upload' },
    ]
    const { import_file_records, multiple_cycle_upload } = this.matchingResults
    this.generalData = [{ import_file_records, multiple_cycle_upload }]
  }

  setInventoryGrids() {
    this.setPropertyData()
    this.setTaxLotData()
  }

  setPropertyData() {
    const { properties } = this.matchingResults
    this.hasPropertyData = Object.values(properties).some((v) => v)
    this.propertyData = Object.entries(properties)
      .filter(([_, v]) => v)
      .map(([k, v]) => ({
        status: this.readableString(k),
        count: v,
      }))
  }

  setTaxLotData() {
    const { tax_lots } = this.matchingResults
    this.hasTaxlotData = Object.values(tax_lots).some((v) => v)
    this.taxlotData = Object.entries(tax_lots)
      .filter(([_, v]) => v)
      .map(([k, v]) => ({
        status: this.readableString(k),
        count: v,
      }))
  }

  readableString(str: string) {
    return str.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
