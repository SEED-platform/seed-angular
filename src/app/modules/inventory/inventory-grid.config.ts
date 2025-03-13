import type { ColDef, GridOptions } from 'ag-grid-community'

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
  // rowSelection: 'multiple',
  rowSelection: {
    mode: 'multiRow',
    checkboxes: true,
    headerCheckbox: true,
  },
}

export const actionButton = {
  field: 'actions',
  headerName: 'Actions',
  cellRenderer: (params) => {
    return `<button class="bg-blue-500 m-1 text-white rounded hover:bg-blue-600" 
              onclick="console.log('Row ID:', ${params.data.id})">
              Click Me
            </button>`
  },
  sortable: false,
  filter: false,
}

// export const selectRow = {
//   field: 'selected',
//   headerName: '',
//   checkboxSelection: true,
//   headerCheckboxSelection: true,
//   filter: false,
//   sortable: false,
//   lockPinned: true,
//   width: 50,
// }

export const firstColumns: ColDef[] = [
  // selectRow,
  actionButton,
]
