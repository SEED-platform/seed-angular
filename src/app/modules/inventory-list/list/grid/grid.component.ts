import { CommonModule } from '@angular/common'
import type { OnChanges, SimpleChanges } from '@angular/core'
import { Component, EventEmitter, inject, Input, Output } from '@angular/core'
import { Router } from '@angular/router'
import { AgGridAngular } from 'ag-grid-angular'
import type { CellClickedEvent, ColDef, ColGroupDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community'
import type { CurrentUser, Label, OrganizationUserSettings } from '@seed/api'
import { OrganizationService } from '@seed/api'
import { ConfigService } from '@seed/services'
import type { FiltersSorts, InventoryType, Pagination } from '../../../inventory'
import { CellHeaderMenuComponent } from './cell-header-menu.component'
import { InventoryGridControlsComponent } from './grid-controls.component'
import { IconHeaderComponent } from './icon-header.component'

@Component({
  selector: 'seed-inventory-grid',
  templateUrl: './grid.component.html',
  imports: [AgGridAngular, CommonModule, InventoryGridControlsComponent],
})
export class InventoryGridComponent implements OnChanges {
  @Input() accessLevelNames: string[] = []
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
  showAccessLevelInstances = true

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
    const groups: ColGroupDef[] = [{ headerName: 'Shortcuts', children: this.getShortcutColumns() } as ColGroupDef]

    const accessLevelCols = this.getAccessLevelColumns()
    if (accessLevelCols.length) {
      groups.push({ headerName: 'Access Level', children: accessLevelCols } as ColGroupDef)
    }

    groups.push({ headerName: 'Details', children: stateColumns } as ColGroupDef)
    this.columnDefs = groups
  }

  getAccessLevelColumns(): ColDef[] {
    if (!this.accessLevelNames?.length) return []
    // Skip root level (index 0) — it's always the same for all instances
    const names = this.accessLevelNames.slice(1)
    return names.map((name) => ({
      field: name,
      headerName: name,
      hide: !this.showAccessLevelInstances,
      filter: true,
      sortable: false,
      resizable: true,
      minWidth: 100,
      headerClass: 'access-level-header',
      cellClass: 'access-level-cell',
    }))
  }

  toggleAccessLevelInstances() {
    this.showAccessLevelInstances = !this.showAccessLevelInstances
    if (this.gridApi) {
      const names = (this.accessLevelNames ?? []).slice(1)
      this.gridApi.setColumnsVisible(names, this.showAccessLevelInstances)
    }
  }

  getShortcutColumns(): ColDef[] {
    const shortcutColumns = [
      this.buildInfoCell(),
      this.buildShortcutColumn('merged_indicator', 'Merged', 44, 'merge'),
      this.buildShortcutColumn('meters_exist_indicator', 'Meters', 44, 'bolt', 'meters'),
      this.buildShortcutColumn('notes_count', 'Notes', 44, 'mode_comment', 'notes'),
      this.buildShortcutColumn('groups_indicator', 'Groups', 44, 'workspaces'),
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
      headerTooltip: headerName,
      headerComponent: IconHeaderComponent,
      headerComponentParams: { icon, tooltip: headerName },
      width: maxWidth,
      maxWidth,
      filter: false,
      sortable: false,
      suppressMovable: true,
      cellClass: 'overflow-hidden',
      cellRenderer: ({ value }) => this.actionRenderer(value, icon, action),
    }
  }

  buildInfoCell() {
    const field = this.type === 'taxlots' ? 'taxlot_view_id' : 'property_view_id'
    return {
      field,
      headerName: 'Info',
      headerTooltip: 'Info',
      headerComponent: IconHeaderComponent,
      headerComponentParams: { icon: 'info', tooltip: 'Info' },
      filter: false,
      sortable: false,
      suppressMovable: true,
      width: 44,
      maxWidth: 44,
      cellRenderer: ({ value }) => this.actionRenderer(value, 'info', 'detail'),
    }
  }

  actionRenderer = (value, icon: string, action: string) => {
    if (!value) return ''

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
