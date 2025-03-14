import type { ColDef, GridOptions } from 'ag-grid-community'
import type { AgGridParams } from './inventory.types'

export const defaultColDef = {
  sortable: true,
  filter: true,
  floatingFilter: true,
  resizable: true,
  filterParams: {
    suppressAndOrCondition: true,
  },
}

export const gridOptions: GridOptions = {
  rowSelection: {
    mode: 'multiRow',
    checkboxes: true,
    headerCheckbox: true,
  },
}

const verticalCenter = 'height: 100%; display: flex; align-items: center;'

const info = {
  field: 'info',
  headerName: 'Info',
  filter: false,
  sortable: false,
  width: 80,
  cellRenderer: (params: AgGridParams) => {
    const eGui = `
      <span
        class="cursor-pointer"
        style="border: 1px solid white; border-radius: 20px; padding: 2px 8px 2px 9px; font-weight: normal"
        onClick="console.log('has info id:', ${params.data.id})"
      >i</span>
      `
    return eGui
  },
}

const merged = {
  field: 'merged',
  headerName: 'Merged',
  width: 80,
  filter: false,
  sortable: false,
  cellRenderer: (params: AgGridParams) => {
    const eGui = `
      <div style="${verticalCenter}">
        <span
          class="ag-icon ag-icon-tick"
          style="margin: auto;"
          onClick="console.log('has merged')"
        ></span>
      </div>
      `
    return params.data.merged_indicator ? eGui : ''
  },
}
const notes = {
  field: 'notes',
  headerName: 'Notes',
  width: 80,
  filter: false,
  sortable: false,
  cellRenderer: (params: AgGridParams) => {
    const eGui = `
      <div style="${verticalCenter}">
        <span
          class="ag-icon ag-icon-tick cursor-pointer"
          onClick="console.log('has notes')"
        ></span>
      </div>
      `
    return params.data.notes_count ? eGui : ''
  },
}

const meters = {
  field: 'meters',
  headerName: 'Meters',
  width: 80,
  filter: false,
  cellRenderer: (params: AgGridParams) => {
    const eGui = `
      <div style="${verticalCenter}">
        <span
          class="ag-icon ag-icon-tick cursor-pointer"
          onClick="console.log('has meters')"
        ></span>
      </div>
      `
    return params.data.meters_exist_indicator ? eGui : ''
  },
}

const groups = {
  field: 'groups',
  headerName: 'Groups',
  width: 80,
  filter: false,
  sortable: false,
  cellRenderer: (params: AgGridParams) => {
    const eGui = `
      <div style="${verticalCenter}">
        <span
          class="ag-icon ag-icon-tick"
          onClick="console.log('has groups')"
        ></span>
      </div>
      `
    return params.data.groups_indicator ? eGui : ''
  },
}

export const constantColumns: ColDef[] = [
  info,
  merged,
  meters,
  notes,
  groups,
]
