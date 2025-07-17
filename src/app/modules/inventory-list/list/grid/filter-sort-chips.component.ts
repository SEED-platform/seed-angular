import { CommonModule } from '@angular/common'
import type { OnChanges, SimpleChanges } from '@angular/core'
import { Component, Input } from '@angular/core'
import { MatChipsModule } from '@angular/material/chips'
import { MatIconModule } from '@angular/material/icon'
import type { ColDef, GridApi } from 'ag-grid-community'
import type { Column } from '@seed/api/column'
import type { OrganizationUserSettings } from '@seed/api/organization'
import type { AgFilter, FilterSortChip, FilterType, InventoryType } from '../../../inventory/inventory.types'

@Component({
  selector: 'seed-inventory-filter-sort-chips',
  templateUrl: './filter-sort-chips.component.html',
  imports: [CommonModule, MatChipsModule, MatIconModule],
})
export class FilterSortChipsComponent implements OnChanges {
  @Input() columns: Column[]
  @Input() columnDefs: ColDef[]
  @Input() gridApi: GridApi
  @Input() userSettings: OrganizationUserSettings
  @Input() type: InventoryType
  filterChips: FilterSortChip[] = []
  sortChips: FilterSortChip[] = []

  ngOnChanges(changes: SimpleChanges) {
    const { userSettings, columnDefs } = changes
    if (userSettings?.currentValue || columnDefs?.currentValue) {
      this.getFilterChips()
      this.getSortChips()
    }
  }

  get sorts() {
    return this.userSettings.sorts?.[this.type] ?? []
  }

  get filters() {
    return this.userSettings.filters?.[this.type] ?? {}
  }

  getFilterChips() {
    this.filterChips = []
    for (const columnName of Object.keys(this.filters)) {
      const colDef = this.columnDefs.find(({ field }) => field === columnName)
      if (colDef) {
        this.filterChips.push({
          field: colDef.field,
          displayName: this.buildFilterDisplayName(colDef, this.filters[columnName]),
          original: columnName,
        })
      } else {
        const column = this.columns.find((c) => c.name === columnName)
        this.filterChips.push({
          field: columnName,
          displayName: column?.display_name ?? columnName,
          original: columnName,
        })
      }
    }
  }

  getSortChips() {
    this.sortChips = []
    for (let sort of this.sorts) {
      const direction = sort.startsWith('-') ? 'desc' : 'asc'
      sort = sort.replace(/^-/, '')
      const colDef = this.columnDefs.find(({ field }) => field === sort)
      if (colDef) {
        this.sortChips.push({
          field: colDef.field,
          displayName: `${colDef.headerName} ${direction}`,
          original: sort,
        })
      } else {
        const column = this.columns.find((c) => c.name === sort)
        const displayName = column?.display_name ?? sort
        this.sortChips.push({
          field: sort,
          displayName: `${displayName} ${direction}`,
          original: sort,
        })
      }
    }
  }

  buildFilterDisplayName(colDef: ColDef, filterModel: AgFilter): string {
    type FilterArgs = { filter?: string | number; filterTo?: string | number }
    const filterMap: Record<FilterType, (args: FilterArgs) => string> = {
      contains: ({ filter }) => `contains ${filter}`,
      notContains: ({ filter }) => `does not contain ${filter}`,
      equals: ({ filter }) => `= ${filter}`,
      notEqual: ({ filter }) => `!= ${filter}`,
      startsWith: ({ filter }) => `starts with ${filter}`,
      endsWith: ({ filter }) => `ends with ${filter}`,
      blank: () => 'is blank',
      notBlank: () => 'is not blank',
      greaterThan: ({ filter }) => `> ${filter}`,
      greaterThanOrEqual: ({ filter }) => `>= ${filter}`,
      lessThan: ({ filter }) => `< ${filter}`,
      lessThanOrEqual: ({ filter }) => `<= ${filter}`,
      between: ({ filter, filterTo }) => `is between ${filter} and ${filterTo}`,
    }

    const { conditions, type, operator } = filterModel
    const header = colDef.headerName

    if (conditions) {
      const [c1, c2] = conditions
      const str1 = filterMap[c1.type](c1)
      const str2 = filterMap[c2.type](c2)
      return `${header} ${str1} ${operator.toLowerCase()} ${str2}`
    }

    const str1 = filterMap[type](filterModel)
    return `${header} ${str1}`
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
}
