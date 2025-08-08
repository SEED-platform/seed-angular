import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { Column, InventoryService, MatchingService, MappableColumnService } from '@seed/api'
import { AlertComponent, ModalHeaderComponent, ProgressBarComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { MaterialImports } from '@seed/materials'
import { ConfigService } from '@seed/services'
import { AgGridAngular } from 'ag-grid-angular'
import { ColDef, GridApi, GridOptions, GridReadyEvent, RowDragEndEvent, RowSelectedEvent } from 'ag-grid-community'
import type { FilterResponse, InventoryType, State } from 'app/modules/inventory/inventory.types'
import { catchError, combineLatest, EMPTY, finalize, Observable, Subject, take, tap } from 'rxjs'

@Component({
  selector: 'seed-merge-modal',
  templateUrl: './merge-modal.component.html',
  imports: [
    AgGridAngular,
    AlertComponent,
    CommonModule,
    MaterialImports,
    ModalHeaderComponent,
    ProgressBarComponent,
    SharedImports,
  ],
})
export class MergeModalComponent implements OnInit, OnDestroy {
  private _configService = inject(ConfigService)
  private _dialogRef = inject(MatDialogRef<MergeModalComponent>)
  private _matchingService = inject(MatchingService)
  private _mappableColumnService = inject(MappableColumnService)
  private _inventoryService = inject(InventoryService)
  private _unsubscribeAll$ = new Subject<void>()
  status: 'loading' | 'review' | 'confirm' | 'complete' | 'error' = 'loading'
  columns: Column[] = []
  inventory: FilterResponse
  metersExist = false
  loading: boolean
  gridTheme$ = this._configService.gridTheme$
  preGridApi: GridApi
  postData: Record<string, unknown>[] = []
  colDefs: ColDef[] = []
  preData: State[] = []
  gridOptions: GridOptions = { rowDragManaged: true }
  gridHeight = 400
  title = 'Merge Inventory'
  results: string[] = []
  errorMessage: string = null
  matchingColumnDisplayNames: string[] = []

  data = inject(MAT_DIALOG_DATA) as {
    cycleId: number;
    orgId: number;
    profileId: number;
    viewIds: number[];
    type: InventoryType;
  }

  ngOnInit(): void {
    const { orgId, viewIds } = this.data
    const metersExist$ = this._inventoryService.propertiesMetersExist(orgId, viewIds)
    const columns$ = this.data.type === 'taxlots' ? this._mappableColumnService.getTaxLotColumns(orgId) : this._mappableColumnService.getPropertyColumns(orgId)
    const inventory$ = this.getInventory$()

    combineLatest([metersExist$, columns$, inventory$])
      .pipe(
        take(1),
        tap(([metersExist, columns, inventory]) => {
          this.metersExist = metersExist
          this.columns = columns
          this.matchingColumnDisplayNames = this.columns.filter((c) => c.is_matching_criteria).map((c) => c.display_name)
          this.inventory = inventory
          this.setGrid()
          this.status = 'review'
        }),
      )
      .subscribe()
  }

  getInventory$(): Observable<FilterResponse> {
    const { cycleId, orgId, profileId, viewIds } = this.data
    const inventory_type = this.data.type === 'taxlots' ? 'taxlot' : 'property'
    const params = new URLSearchParams({
      cycle: cycleId.toString(),
      ids_only: 'false',
      include_related: 'true',
      inventory_type,
      organization_id: orgId.toString(),
      page: '1',
      per_page: '999999999',
    })

    const data = {
      include_property_ids: null,
      profile_id: profileId,
      include_view_ids: viewIds,
    }

    return this._inventoryService.getAgInventory(params.toString(), data)
  }

  setGrid() {
    this.preData = this.inventory.results as State[]
    this.gridHeight = Math.min(this.preData.length * 35 + 43, 500)
    const dragRow: ColDef = { field: 'Drag', rowDrag: true, resizable: false, width: 70, pinned: 'left' }
    this.colDefs = [dragRow, ...this.inventory.column_defs]
    this.postData = [this.preData[0]]
  }

  onPreGridReady(agGrid: GridReadyEvent) {
    this.preGridApi = agGrid.api
  }

  onRowDragEnd() {
    const firstRow = this.preGridApi.getDisplayedRowAtIndex(0)
    this.postData = [firstRow.data] as State[]
  }

  onSubmit() {
    this.status = 'confirm'
    this.title = 'Are you sure you want to continue?'
    console.log('are you sure')
  }

  onConfirm() {
    const { orgId, viewIds, type } = this.data
    const singularType = type === 'taxlots' ? 'tax lot' : 'property'
    this._matchingService.mergeInventory(orgId, viewIds, type)
      .pipe(
        tap(({ match_link_count, match_merged_count }) => {
          this.results = [
            `Resulting ${singularType} has ${match_link_count} cross cycle links`,
            `${match_merged_count} subsequent ${type} merged`,
          ]
          this.status = 'complete'
          this.title = 'Merge Complete'
        }),
        catchError(({ message }) => {
          this.errorMessage = message as string
          this.status = 'error'
          return EMPTY
        }),
      )
      .subscribe()
  }

  close(success = false): void {
    this._dialogRef.close(success)
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
