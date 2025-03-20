import { CommonModule } from '@angular/common'
import type { OnChanges, OnInit, SimpleChanges } from '@angular/core'
import { Component, EventEmitter, inject, Input, Output } from '@angular/core'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { ColDef, ColGroupDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community'
import { AllCommunityModule, colorSchemeDarkBlue, colorSchemeLight, ModuleRegistry, themeAlpine } from 'ag-grid-community'
import type { Label } from '@seed/api/label'
import { ConfigService } from '@seed/services'
import type { AgFilter, AgFilterModel, FiltersSorts, InventoryPagination } from '../inventory.types'
import { InventoryGridControlsComponent } from './grid-controls.component'

ModuleRegistry.registerModules([AllCommunityModule])

@Component({
  selector: 'seed-inventory-grid',
  templateUrl: './grid.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    CommonModule,
    InventoryGridControlsComponent,
  ],
})
export class InventoryGridComponent implements OnChanges, OnInit {
  @Input() columnDefs!: ColDef[]
  @Input() labelLookup: Record<number, Label>
  @Input() pagination!: InventoryPagination
  @Input() rowData!: Record<string, unknown>[]
  @Input() selectedViewIds: number[]
  @Output() pageChange = new EventEmitter<number>()
  @Output() filterSortChange = new EventEmitter<FiltersSorts>()
  @Output() gridReady = new EventEmitter<GridApi>()
  @Output() selectionChanged = new EventEmitter<null>()

  private _configService = inject(ConfigService)

  agPageSize = 100
  gridApi!: GridApi
  gridTheme = themeAlpine.withPart(colorSchemeLight)
  defaultColDef = {
    sortable: true,
    filter: true,
    floatingFilter: true,
    resizable: true,
    filterParams: {
      suppressAndOrCondition: true,
    },
  }
  gridOptions: GridOptions = {
    rowSelection: {
      mode: 'multiRow',
      checkboxes: true,
      headerCheckbox: true,
    },
    onSelectionChanged: () => { this.onSelectionChanged() },
  }

  ngOnInit(): void {
    this.setTheme()
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.rowData) {
      this.getColumnDefs()
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api
    this.gridReady.emit(this.gridApi)
  }

  setTheme() {
    this._configService.config$.subscribe(({ scheme }) => {
      // if auto, check browser preference, otherwise use scheme
      const darkMode = scheme === 'auto'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : scheme === 'dark'

      this.gridTheme = themeAlpine.withPart(darkMode ? colorSchemeDarkBlue : colorSchemeLight)
    })
  }

  onSelectionChanged() { this.selectionChanged.emit() }

  getColumnDefs() {
    this.columnDefs = [
      { headerName: 'Shortcuts', children: this.getShortcutColumns() } as ColGroupDef,
      { headerName: 'Details', children: this.columnDefs } as ColGroupDef,
    ]
  }

  getShortcutColumns(): ColDef[] {
    const tempAction = (message: string) => {
      console.log(message)
    }

    const shortcutColumns = [
      this.buildInfoCell(),
      this.buildShortcutColumn('merged_indicator', 'Merged', 85, 'ag-icon ag-icon-tick'),
      this.buildShortcutColumn('meters_exist_indicator', 'Meters', 80, 'ag-icon ag-icon-tick cursor-pointer', () => { tempAction('meters') }),
      this.buildShortcutColumn('notes_count', 'Notes', 80, 'ag-icon ag-icon-tick cursor-pointer', () => { tempAction('notes') }),
      this.buildShortcutColumn('groups_indicator', 'Groups', 80, 'ag-icon ag-icon-tick cursor-pointer'),
      this.buildLabelsCell(),
    ]
    return shortcutColumns
  }

  buildShortcutColumn(field: string, headerName: string, width: number, className: string, action: () => void = null): ColDef {
    return {
      field,
      headerName,
      width,
      filter: false,
      sortable: false,
      cellRenderer: ({ value }) => {
        return value ? this.buildCellRenderer(className, action) : ''
      },
    }
  }

  buildInfoCell() {
    return {
      field: 'id',
      headerName: 'Info',
      filter: false,
      sortable: false,
      width: 60,
      cellRenderer: ({ value }) => {
        const eGui = document.createElement('span')
        eGui.className = 'cursor-pointer truncate'
        eGui.style.cssText = 'border: 1px solid white; border-radius: 20px; padding: 2px 8px 2px 9px; font-weight: normal;'
        eGui.textContent = 'i'
        eGui.onclick = () => {
          console.log('/details/', value)
        }
        return eGui
      },
    }
  }

  buildCellRenderer(className: string, action: () => void = null) {
    const eGui = document.createElement('div')
    eGui.style.cssText = 'height: 100%; display: flex; align-items: center;'
    const icon = document.createElement('span')
    icon.className = className
    icon.style.margin = 'auto'
    if (action) icon.addEventListener('click', action)
    eGui.appendChild(icon)
    return eGui
  }

  buildLabelsCell() {
    return {
      field: 'labels',
      headerName: 'Labels',
      width: 80,
      filter: false,
      sortable: false,
      // labels come in as an array of ids [1,2,3]. Ag grid needs them formatted as a string
      valueFormatter: ({ value }: { value: number[] }) => {
        const labels = value
        return labels?.length ? labels.map((id: number) => this.labelLookup[id]?.name).join(', ') : ''
      },
      cellRenderer: ({ value }: { value: number[] }) => {
        const labels = value
        if (!labels.length) return ''
        const eLabels = labels.map((id: number) => `<div class="label ${this.labelLookup[id].color} whitespace-nowrap px-2">${this.labelLookup[id].name}</div>`).join(' ')
        const eGui = `<div>${eLabels}</div>`
        return value ? eGui : ''
      },
    }
  }

  resetColumns = () => { this.gridApi?.resetColumnState() }

  /*
  * ascending sorts formatted as 'column_id'
  * descending sorts formatted as '-column_id'
  */
  getSorts() {
    const sorts = this.gridApi.getColumnState()
      .filter((col) => col.sort)
      .map((col) => `${col.sort === 'desc' ? '-' : ''}${col.colId}`)
    return sorts
  }

  getFilters(): string[][] {
    const filterModels: AgFilterModel = this.gridApi.getFilterModel()
    const filters: string[][] = []
    for (const columnName of Object.keys(filterModels)) {
      const filterModel: AgFilter = filterModels[columnName]
      filters.push(this.buildFilter(columnName, filterModel))
    }
    return filters
  }

  // TODO: the backend should handle the filter building. This is being forced into the existing API
  buildFilter(columnName: string, { filter, type }: { filter: number | string; type: string }): string[] {
    const prefixLookup: Record<string, string> = {
      contains: '__icontains',
      notContains: '??',
      equals: '__exact',
      notEqual: '__ne',
      startsWith: '??',
      endsWith: '??',
      blank: '__exact',
      notBlank: '__ne',
      greaterThan: '__gt',
      greaterThanOrEqual: '__gte',
      lessThan: '__lt',
      lessThanOrEqual: '__lte',
      between: '__gt and __lt', // needs to be updated to allow multiple filters...
    }
    const blankFilter = ['blank', 'notBlank'].includes(type)
    const key = columnName + prefixLookup[type]
    const value = blankFilter ? null : filter.toString()

    return [key, value]
  }

  onFilterSortChange() {
    const filters = this.getFilters()
    const sorts = this.getSorts()
    this.filterSortChange.emit({ filters, sorts })
  }

  onPageChange(page: number) {
    this.pageChange.emit(page)
  }
}
