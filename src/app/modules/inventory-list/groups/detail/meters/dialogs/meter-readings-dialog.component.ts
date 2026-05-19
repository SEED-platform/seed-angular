import { AsyncPipe } from '@angular/common'
import { Component, inject, type OnInit } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { AgGridAngular } from 'ag-grid-angular'
import type { ColDef } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import type { GroupMeter, MeterReadingDetail } from '@seed/api'
import { GroupsService } from '@seed/api'
import { MaterialImports } from '@seed/materials'
import { ConfigService } from '@seed/services'

ModuleRegistry.registerModules([AllCommunityModule])

export type MeterReadingsDialogData = {
  orgId: number;
  meter: GroupMeter;
}

@Component({
  selector: 'seed-meter-readings-dialog',
  template: `
    <h2 mat-dialog-title>Readings: {{ data.meter.alias }}</h2>
    <mat-dialog-content class="min-h-64">
      @if (loading) {
        <p class="text-secondary">Loading readings...</p>
      } @else if (readings.length === 0) {
        <p class="text-secondary">No readings found for this meter.</p>
      } @else {
        <p class="text-hint text-xs mb-2">{{ readings.length }} readings</p>
        <div class="h-80">
          <ag-grid-angular
            class="w-full h-full"
            [theme]="gridTheme$ | async"
            [rowData]="readings"
            [columnDefs]="columnDefs"
            [defaultColDef]="defaultColDef"
          />
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  imports: [AgGridAngular, AsyncPipe, MaterialImports],
})
export class MeterReadingsDialogComponent implements OnInit {
  private _configService = inject(ConfigService)
  private _groupsService = inject(GroupsService)
  dialogRef = inject(MatDialogRef<MeterReadingsDialogComponent>)
  data = inject<MeterReadingsDialogData>(MAT_DIALOG_DATA)
  gridTheme$ = this._configService.gridTheme$

  loading = true
  readings: MeterReadingDetail[] = []
  columnDefs: ColDef[] = [
    { headerName: 'Start Time', field: 'start_time', flex: 1 },
    { headerName: 'End Time', field: 'end_time', flex: 1 },
    { headerName: 'Reading', field: 'reading', flex: 1 },
    { headerName: 'Unit', field: 'source_unit', width: 100 },
  ]

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  }

  ngOnInit() {
    this._groupsService.getMeterReadings(this.data.orgId, this.data.meter.id).subscribe({
      next: (readings) => {
        this.readings = readings
        this.loading = false
      },
      error: () => {
        this.readings = []
        this.loading = false
      },
    })
  }
}
