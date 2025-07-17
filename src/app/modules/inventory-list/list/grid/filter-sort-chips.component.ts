import { CommonModule } from '@angular/common'
import type { OnChanges, SimpleChanges } from '@angular/core'
import { Component, Input } from '@angular/core'
import type { ColDef, GridApi } from 'ag-grid-community'
import type { OrganizationUserSettings } from '@seed/api/organization'
import { MaterialImports } from '@seed/materials'
import type { AgFilter, FilterSortChip, FilterType, InventoryType } from '../../../inventory/inventory.types'

@Component({
  selector: 'seed-inventory-filter-sort-chips',
  templateUrl: './filter-sort-chips.component.html',
  imports: [CommonModule, MaterialImports],
})
export class FilterSortChipsComponent implements OnChanges {
  @Input() gridApi: GridApi
  @Input() columnDefs: ColDef[]
  @Input() userSettings: OrganizationUserSettings
  @Input() type: InventoryType
  filterChips: FilterSortChip[] = []
  sortChips: FilterSortChip[] = []

  ngOnChanges({ userSettings }: SimpleChanges) {
    if (userSettings?.currentValue) {
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

      if (!colDef) return

      const displayName = this.buildFilterDisplayName(colDef, this.filters[columnName])
      const chip = { field: colDef.field, displayName, original: columnName }
      this.filterChips.push(chip)
    }
  }

  getSortChips() {
    this.sortChips = []
    for (let sort of this.sorts) {
      const direction = sort.startsWith('-') ? 'desc' : 'asc'
      sort = sort.replace(/^-/, '')
      const colDef = this.columnDefs.find(({ field }) => field === sort)

      if (!colDef) return

      const chip = { field: colDef.field, displayName: `${colDef.headerName} ${direction}`, original: sort }
      this.sortChips.push(chip)
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
