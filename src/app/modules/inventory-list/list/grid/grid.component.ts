import { CommonModule } from '@angular/common'
import type { OnChanges, SimpleChanges } from '@angular/core'
import { Component, EventEmitter, inject, Input, Output } from '@angular/core'
import { Router } from '@angular/router'
import { AgGridAngular } from 'ag-grid-angular'
import type { CellClickedEvent, ColDef, ColGroupDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community'
import type { CurrentUser, Label, OrganizationUserSettings } from '@seed/api'
import { OrganizationService } from '@seed/api'
import { ConfigService } from '@seed/services'
import type { FiltersSorts, InventoryType, Pagination } from '../../../inventory/inventory.types'
import { CellHeaderMenuComponent } from './cell-header-menu.component'
import { InventoryGridControlsComponent } from './grid-controls.component'

@Component({
  selector: 'seed-inventory-grid',
  templateUrl: './grid.component.html',
  imports: [
    AgGridAngular,
    CellHeaderMenuComponent,
    CommonModule,
    InventoryGridControlsComponent,
  ],
})
export class InventoryGridComponent implements OnChanges {
  @Input() columnDefs!: ColDef[]
  @Input() currentUser: CurrentUser
  @Input() inventoryType: string
  @Input() labelMap: Record<number, Label>
  @Input() orgId: number
  @Input() orgUserId: number
  @Input() pagination!: Pagination
  @Input() rowData!: Record<string, unknown>[]
  @Input() selectedViewIds: number[]
  @Input() type: InventoryType
  @Input() userSettings: OrganizationUserSettings
  @Output() pageChange = new EventEmitter<number>()
  @Output() filterSortChange = new EventEmitter<FiltersSorts>()
  @Output() gridReady = new EventEmitter<GridApi>()
  @Output() selectionChanged = new EventEmitter<null>()
  @Output() gridReset = new EventEmitter<null>()
  private _configService = inject(ConfigService)
  private _organizationService = inject(OrganizationService)
  private _router = inject(Router)

  agPageSize = 100
  gridApi!: GridApi
  darkMode: boolean
  gridTheme$ = this._configService.gridTheme$

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
    onSelectionChanged: () => {
      this.onSelectionChanged()
    },
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.rowData) {
      this.getColumnDefs()
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api
    this.gridReady.emit(this.gridApi)
    this.gridApi.autoSizeAllColumns()
    this.gridApi.addEventListener('cellClicked', this.onCellClicked.bind(this) as (event: CellClickedEvent) => void)
  }

  onCellClicked(event: CellClickedEvent) {
    const clickableField = new Set(['property_view_id', 'taxlot_view_id', 'notes_count', 'meters_exist_indicator'])
    if (!clickableField.has(event.colDef.field)) return

    const target = event.event.target as HTMLElement
    const action = target.getAttribute('data-action') as 'detail' | 'notes' | 'meters' | null
    if (!action) return
    const { property_view_id, taxlot_view_id } = event.data as { property_view_id: string; taxlot_view_id: string }
    const viewId = property_view_id || taxlot_view_id

    const urlMap = {
      detail: [`/${this.inventoryType}`, viewId],
      notes: [`/${this.inventoryType}`, viewId, 'notes'],
      meters: [`/${this.inventoryType}`, viewId, 'meters'],
    }

    return void this._router.navigate(urlMap[action])
  }

  onSelectionChanged() {
    this.selectionChanged.emit()
  }

  getColumnDefs() {
    const stateColumns = this.addHeaderMenu()

    this.columnDefs = [
      { headerName: 'Shortcuts', children: this.getShortcutColumns() } as ColGroupDef,
      { headerName: 'Details', children: stateColumns } as ColGroupDef,
    ]
  }

  getShortcutColumns(): ColDef[] {
    const shortcutColumns = [
      this.buildInfoCell(),
      this.buildShortcutColumn('merged_indicator', 'Merged', 82, 'share'),
      this.buildShortcutColumn('meters_exist_indicator', 'Meters', 78, 'bolt', 'meters'),
      this.buildShortcutColumn('notes_count', 'Notes', 71, 'mode_comment', 'notes'),
      this.buildShortcutColumn('groups_indicator', 'Groups', 79, 'G'),
      this.buildLabelsCell(),
    ]
    return shortcutColumns
  }

  addHeaderMenu() {
    const stateColumns = this.columnDefs.map((c) => ({
      ...c,
      headerComponent: CellHeaderMenuComponent,
      headerComponentParams: {
        currentUser: this.currentUser,
        type: this.type,
      },
    }))
    return stateColumns
  }

  buildShortcutColumn(field: string, headerName: string, maxWidth: number, icon: string, action: string = null): ColDef {
    return {
      field,
      headerName,
      maxWidth,
      filter: false,
      sortable: false,
      suppressMovable: true,
      headerClass: 'white-space-normal',
      cellClass: 'overflow-hidden',
      cellRenderer: ({ value }) => this.actionRenderer(value, icon, action),
    }
  }

  buildInfoCell() {
    const field = this.type === 'taxlots' ? 'taxlot_view_id' : 'property_view_id'
    return {
      field,
      headerName: 'Info',
      filter: false,
      sortable: false,
      resizable: false,
      suppressMovable: true,
      maxWidth: 60,
      cellRenderer: ({ value }) => this.actionRenderer(value, 'info', 'detail'),
    }
  }

  actionRenderer = (value, icon: string, action: string) => {
    if (!value) return ''
    // Allow a single letter to be passed as an indicator (like G for groups)
    if (icon.length === 1) {
      return `<span class="font-bold text-lg">${icon}</span>`
    }

    const cursorClass = action ? 'cursor-pointer' : ''
    return `
      <div class="flex gap-2 mt-2 align-center">
        <span class="material-icons-outlined ${cursorClass}" data-action="${action}">${icon}</span>
      </div>
    `
  }

  buildLabelsCell() {
    return {
      field: 'labels',
      headerName: 'Labels',
      width: 80,
      filter: false,
      sortable: false,
      suppressMovable: true,
      // labels come in as an array of ids [1,2,3]. Ag grid needs them formatted as a string
      valueFormatter: ({ value }: { value: number[] }) => {
        const labels = value
        return labels?.length ? labels.map((id: number) => this.labelMap[id]?.name).join(', ') : ''
      },
      cellRenderer: ({ value }: { value: number[] }) => {
        const labels = value
        if (!labels.length) return ''

        const eLabels = labels
          .map((id: number) => {
            return this.labelMap[id]
              ? `<div class="label ${this.labelMap[id]?.color} whitespace-nowrap px-2">${this.labelMap[id].name}</div>`
              : ''
          })
          .join(' ')

        const eGui = `<div>${eLabels}</div>`
        return value ? eGui : ''
      },
    }
  }

  /*
   * ascending sorts formatted as 'column_id'
   * descending sorts formatted as '-column_id'
   */
  getSorts() {
    const sorts = this.gridApi
      .getColumnState()
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
