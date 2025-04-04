import { CommonModule } from '@angular/common'
import type { OnChanges, OnInit, SimpleChanges } from '@angular/core'
import { Component, EventEmitter, inject, Input, Output } from '@angular/core'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { ColDef, ColGroupDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community'
import { AllCommunityModule, colorSchemeDarkBlue, colorSchemeLight, ModuleRegistry, themeAlpine } from 'ag-grid-community'
import { map, tap } from 'rxjs'
import type { Label } from '@seed/api/label'
import { ConfigService } from '@seed/services'
import type { FiltersSorts, InventoryPagination, InventoryType } from '../inventory.types'
// import { CellHeaderMenuComponent } from './cell-header-menu.component'
import { InventoryGridControlsComponent } from './grid-controls.component'

ModuleRegistry.registerModules([AllCommunityModule])

@Component({
  selector: 'seed-inventory-grid',
  templateUrl: './grid.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    // CellHeaderMenuComponent,
    CommonModule,
    InventoryGridControlsComponent,
  ],
})
export class InventoryGridComponent implements OnInit, OnChanges {
  @Input() columnDefs!: ColDef[]
  @Input() inventoryType: InventoryType
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
  darkMode: boolean
  gridTheme = themeAlpine.withPart(colorSchemeLight)
  theme: string

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
    rowClassRules: {
      'even-row': (params) => params.node.rowIndex % 2 === 0,
    },
    onSelectionChanged: () => { this.onSelectionChanged() },
  }

  ngOnInit() {
    this._configService.config$.pipe(
      map(({ scheme }) => {
        return scheme === 'auto'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
          : scheme
      }),
      tap((theme) => {
        this.gridTheme = themeAlpine.withPart(theme === 'dark' ? colorSchemeDarkBlue : colorSchemeLight)
        this.theme = theme
      }),
    ).subscribe()
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
        const eGui = document.createElement('a')
        eGui.href = `/${this.inventoryType}/${value}`
        eGui.textContent = 'i'
        eGui.className = 'cursor-pointer truncate border border-gray-400 dark:border-white'
        eGui.style.cssText = 'border-radius: 20px; padding: 2px 8px 2px 9px; font-weight: normal;'
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

        const eLabels = labels.map((id: number) => {
          return this.labelLookup[id]
            ? `<div class="label ${this.labelLookup[labels[0]]?.color} whitespace-nowrap px-2">${this.labelLookup[id].name}</div>`
            : ''
        }).join(' ')

        const eGui = `<div>${eLabels}</div>`
        return value ? eGui : ''
      },
    }
  }

  resetGrid = () => {
    if (!this.gridApi) return

    this.gridApi.setFilterModel(null)
    this.gridApi.applyColumnState({ state: [], applyOrder: true })
    this.gridApi.resetColumnState()
    this.gridApi.refreshClientSideRowModel()
  }

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

  onFilterSortChange() {
    const filters = this.gridApi.getFilterModel()
    const sorts = this.getSorts()
    this.filterSortChange.emit({ sorts, filters })
  }

  onPageChange(page: number) {
    this.pageChange.emit(page)
  }
}
