import { Location } from '@angular/common'
import { Component, inject, type OnDestroy, ViewEncapsulation } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { MatDialog } from '@angular/material/dialog'
import type { CellClickedEvent, ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import { filter, Subject, takeUntil, tap } from 'rxjs'
import { type Column, ColumnService } from '@seed/api/column'
import { type Organization, OrganizationService } from '@seed/api/organization'
import { SharedImports } from '@seed/directives'
import { ConfigService } from '@seed/services'
import { naturalSort } from '@seed/utils'
import type { InventoryType } from 'app/modules/inventory'
import { ConfirmModalComponent } from './modal/confirm-modal.component'

@Component({
  selector: 'seed-organizations-column-matching-criteria',
  template: '',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports],
})
export class MatchingCriteriaComponent implements OnDestroy {
  private _configService = inject(ConfigService)
  protected _columnService = inject(ColumnService)
  private _location = inject(Location)
  protected _organizationService = inject(OrganizationService)
  protected readonly _unsubscribeAll$ = new Subject<void>()
  private _dialog = inject(MatDialog)
  availableColumns: Column[]
  addForm = new FormGroup({ columnToAdd: new FormControl<number>(null) })
  columnDefsCurrent: ColDef[] = []
  columnDefsPending: ColDef[] = []
  columns: Column[]
  defaultColDef = { sortable: false, filter: false, suppressMovable: true }
  gridApiCurrent: GridApi
  gridApiPending: GridApi
  gridTheme$ = this._configService.gridTheme$
  matchingColumns: Column[]
  organization: Organization
  originalMatchingColumns: Column[]
  rowDataCurrent: Record<string, unknown>[] = []
  rowDataPending: Record<string, unknown>[] = []

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  get currentType() {
    return this._location.path().split('/').pop() as InventoryType
  }

  populateMatchingColumns(columns: Column[]) {
    const tableName = this.currentType === 'properties' ? 'PropertyState' : 'TaxLotState'
    this.columns = columns.filter((c) => c.table_name === tableName).sort((a, b) => naturalSort(a.display_name, b.display_name))
    this.matchingColumns = this.columns.filter((c) => c.is_matching_criteria)
    this.availableColumns = this.columns.filter((c) => !c.is_matching_criteria && !c.derived_column && !c.is_extra_data)
    this.initGrid()
  }

  initGrid() {
    this.setColDefs()
    this.setRowData()
  }

  setColDefs() {
    this.columnDefsCurrent = [
      { field: 'id', hide: true },
      { field: 'display_name', headerName: 'Column Name' },
      { field: 'status', headerName: 'Status', cellClass: 'text-secondary' },
    ]
    this.columnDefsPending = [
      { field: 'id', hide: true },
      { field: 'display_name', headerName: 'Column Name' },
      { field: 'actions', headerName: 'Actions', cellRenderer: this.actionRenderer },
    ]
  }

  actionRenderer = () => {
    return `
      <div class="flex gap-2 mt-2 align-center"">
        <span class="material-icons cursor-pointer text-secondary" data-action="delete">clear</span>
      </div>
    `
  }

  setRowData() {
    this.rowDataCurrent = []
    this.rowDataPending = []

    this.rowDataCurrent = this.matchingColumns.map((column) => ({
      id: column.id,
      display_name: column.display_name,
      status: 'Locked',
    }))
  }

  get gridHeightCurrent() {
    return Math.min(this.rowDataCurrent.length * 42 + 50, 500)
  }
  get gridHeightPending() {
    return Math.min(this.rowDataPending.length * 42 + 50, 500)
  }

  onCurrentReady(params: GridReadyEvent) {
    this.gridApiCurrent = params.api
    this.gridApiCurrent.sizeColumnsToFit()
  }

  onPendingReady(params: GridReadyEvent) {
    this.gridApiPending = params.api
    this.gridApiPending.sizeColumnsToFit()
    this.gridApiPending.addEventListener('cellClicked', this.onRemoveColumn.bind(this) as (event: CellClickedEvent) => void)
  }

  onRemoveColumn(event: CellClickedEvent) {
    if (event.colDef.field !== 'actions') return

    const target = event.event.target as HTMLElement
    const action = target.getAttribute('data-action')
    if (!action) return

    const { id } = event.data as { id: string }
    const column = this.columns.find((c) => c.id === parseInt(id))
    this.rowDataPending = this.rowDataPending.filter((c) => c.id !== column.id)
  }

  addColumn() {
    const col = this.columns.find((c) => c.id === this.addForm.get('columnToAdd').value)
    this.rowDataPending = [...this.rowDataPending, { id: col.id, display_name: col.display_name }]
  }

  save = () => {
    const columnIds = new Set(this.rowDataPending.map((c) => c.id))
    const columns = this.columns.filter((c) => columnIds.has(c.id))

    const dialogRef = this._dialog.open(ConfirmModalComponent, {
      width: '40rem',
      data: { cycle: null, orgId: this.organization.id, columns },
    })

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        filter(Boolean),
        tap(() => {
          if (this.currentType === 'properties') {
            this._columnService.getPropertyColumns(this.organization.id).subscribe((columns) => {
              this.populateMatchingColumns(columns)
            })
          } else if (this.currentType === 'taxlots') {
            this._columnService.getTaxLotColumns(this.organization.id).subscribe((columns) => {
              this.populateMatchingColumns(columns)
            })
          }
        }),
      )
      .subscribe()
  }
}
