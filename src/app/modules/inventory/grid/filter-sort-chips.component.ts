import type { OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core'
import { Component, Input } from '@angular/core'
import { MatChipsModule } from '@angular/material/chips'
import { MatIconModule } from '@angular/material/icon'
import type { ColDef, GridApi, SortModelItem } from 'ag-grid-community'
import { Subject } from 'rxjs'
import type { FilterSortChip } from '../inventory.types'

@Component({
  selector: 'seed-inventory-filter-sort-chips',
  templateUrl: './filter-sort-chips.component.html',
  imports: [
    MatChipsModule,
    MatIconModule,
  ],
})
export class FilterSortChipsComponent implements OnChanges, OnDestroy, OnInit {
  @Input() gridApi: GridApi
  @Input() columnDefs: ColDef[]
  @Input() filters: Record<string, unknown>
  @Input() sorts: string[]
  filterChips: FilterSortChip[] = []
  sortChips: FilterSortChip[] = []
  private readonly _unsubscribeAll$ = new Subject<void>()
  // private _columnMap: Record<string, string> = {}
  // private _filterMap: Record<string, string> = {}

  ngOnInit() {
    console.log('init')
    // this._columnMap = Object.fromEntries(this.columnDefs.map(({ field, headerName }) => [field, headerName]))
  }

  ngOnChanges({ filters, sorts }: SimpleChanges) {
    if (filters?.currentValue) this.getFilterChips()
    if (sorts?.currentValue) this.getSortChips()
  }

  getFilterChips() {
    this.filterChips = []
    for (const columnName of Object.keys(this.filters)) {
      const colDef = this.columnDefs.find(({ field }) => field === columnName)
      const chip = { field: colDef.field, displayName: colDef.headerName, original: columnName }
      this.filterChips.push(chip)
    }
  }

  getSortChips() {
    this.sortChips = []
    for (let sort of this.sorts) {
      const direction = sort.startsWith('-') ? 'desc' : 'asc'
      sort = sort.replace(/^-/, '')
      const colDef = this.columnDefs.find(({ field }) => field === sort)
      const chip = { field: colDef.field, displayName: `${colDef.headerName} ${direction}`, original: sort }
      this.sortChips.push(chip)
    }
  }

  removeFilter(columnName: string): void {
    const currentFilters = this.gridApi.getFilterModel()
    Reflect.deleteProperty(currentFilters, columnName)
    this.gridApi.setFilterModel(currentFilters)
  }

  removeSort(sortToRemove: string): void {
    const currentState = this.gridApi.getColumnState()
    const updatedState = currentState.map((col) => {
      return col.colId === sortToRemove ? { ...col, sort: null } : col
    })
    this.gridApi.applyColumnState({ state: updatedState })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
