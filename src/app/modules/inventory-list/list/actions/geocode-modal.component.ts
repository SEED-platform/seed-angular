import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { forkJoin, Subject, tap } from 'rxjs'
import { GeocodeService } from '@seed/api'
import type { ConfidenceSummary, GeocodingColumns } from '@seed/api/geocode/geocode.types'
import { AlertComponent, ModalHeaderComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { MaterialImports } from '@seed/materials'
import type { InventoryType } from 'app/modules/inventory/inventory.types'

@Component({
  selector: 'seed-geocode-modal',
  templateUrl: './geocode-modal.component.html',
  imports: [AlertComponent, MaterialImports, ModalHeaderComponent, SharedImports],
})
export class GeocodeModalComponent implements OnInit, OnDestroy {
  private _dialogRef = inject(MatDialogRef<GeocodeModalComponent>)
  private _geocodeService = inject(GeocodeService)
  private _unsubscribeAll$ = new Subject<void>()

  confidenceSummary: ConfidenceSummary
  geocodingEnabled = true
  hasApiKey = true
  hasEnoughGeoCols = true
  hasGeoColumns = true
  suggestVerify = true
  notGeocoded = false

  geocodeState: 'verify' | 'geocode' | 'result' | 'fail' = 'verify'

  data = inject(MAT_DIALOG_DATA) as {
    orgId: number;
    viewIds: number[];
    type: InventoryType;
  }

  get valid() {
    return this.hasApiKey && this.geocodingEnabled && this.hasGeoColumns
  }

  ngOnInit(): void {
    this.getGeocodeConfig()
  }

  getGeocodeConfig() {
    forkJoin([
      this._geocodeService.checkApiKey(this.data.orgId),
      this._geocodeService.geocodingEnabled(this.data.orgId),
      this._geocodeService.geocodingColumns(this.data.orgId),
      this._geocodeService.confidenceSummary(this.data.orgId, this.data.viewIds, this.data.type),
    ]).pipe(
      tap(([hasApiKey, geocodingEnabled, geoColumns, confidenceSummary]) => {
        this.hasApiKey = hasApiKey
        this.geocodingEnabled = geocodingEnabled
        this.processGeoColumns(geoColumns)
        this.processConfidenceSummary(confidenceSummary)
        this.suggestVerify = hasApiKey && this.hasGeoColumns && this.geocodeState === 'verify'
      }),
    ).subscribe()
  }

  processGeoColumns({ PropertyState, TaxLotState }: GeocodingColumns) {
    this.hasGeoColumns = this.data.type === 'taxlots' ? TaxLotState.length > 0 : PropertyState.length > 0
  }

  processConfidenceSummary(confidenceSummary: ConfidenceSummary) {
    this.confidenceSummary = confidenceSummary
    // Process the confidence summary as needed
  }

  close(success = false) {
    this._dialogRef.close(success)
  }

  onSubmit() {
    console.log('submit')
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
