import { EditHeaderComponent } from '@seed/components'
import { AutocompleteCellComponent } from '@seed/components/ag-grid/autocomplete.component'
import type { CellValueChangedEvent, ColDef, ColGroupDef, ICellRendererParams } from 'ag-grid-community'
import { dataTypeOptions, unitMap } from './constants'

export const gridOptions = {
  singleClickEdit: true,
  suppressMovableColumns: true,
  // defaultColDef: { cellClass: (params: CellClassParams) => params.colDef.editable ? 'bg-primary bg-opacity-25' : '' },
}

// Special cases
const canEdit = (dataType: string, field: string, isNewColumn: boolean): boolean => {
  const editMap: Record<string, boolean> = {
    dataType: isNewColumn,
    inventory_type: true,
    units: ['EUI', 'Area', 'GHG', 'GHG Intensity', 'Water use', 'WUI'].includes(dataType),
  }

  return editMap[field]
}

const dropdownRenderer = (params: ICellRendererParams) => {
  const value = params.value as string
  const data = params.data as { dataType: string; isNewColumn: boolean }
  const field = params.colDef.field

  if (!canEdit(data.dataType, field, data.isNewColumn)) {
    return value
  }

  return `
    <div class="flex justify-between -ml-3 w-[115%] h-full cursor-pointer">
      <span class="px-2">${value ?? ''}</span>
      <span class="material-icons text-secondary">arrow_drop_down</span>
    </div>
  `
}

const canEditClass = 'bg-primary bg-opacity-25 rounded'

export const buildColumnDefs = (
  columnNames: string[],
  uploadedFilename: string,
  seedHeaderChange: (event: CellValueChangedEvent) => void,
  dataTypeChange: (event: CellValueChangedEvent) => void,
): (ColDef | ColGroupDef)[] => {
  const seedCols: ColDef[] = [
    { field: 'isExtraData', hide: true },
    { field: 'isNewColumn', hide: true },
    // OMIT
    {
      field: 'omit',
      headerName: 'Omit',
      cellEditor: 'agCheckboxCellEditor',
      editable: true,
      width: 70,
    },
    {
      field: 'inventory_type',
      headerName: 'Inventory Type',
      headerComponent: EditHeaderComponent,
      headerComponentParams: {
        name: 'Inventory Type',
      },
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Property', 'Tax Lot'],
      },
      cellRenderer: dropdownRenderer,
      editable: true,
      cellClass: canEditClass,
    },
    // SEED HEADER
    {
      field: 'seed_header',
      headerName: 'SEED Header',
      cellEditor: AutocompleteCellComponent,
      cellEditorParams: {
        values: columnNames,
      },
      headerComponent: EditHeaderComponent,
      headerComponentParams: {
        name: 'SEED Header',
      },
      onCellValueChanged: seedHeaderChange,
      editable: true,
      cellClass: canEditClass,
    },
  ]

  const fileCols: ColDef[] = [
    // DATA TYPE: Editable if isExtraData is true
    {
      field: 'dataType',
      headerName: 'Data Type',
      headerComponent: EditHeaderComponent,
      headerComponentParams: {
        name: 'Data Type',
      },
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: dataTypeOptions,
      },
      cellRenderer: dropdownRenderer,
      editable: (params) => {
        const data = params?.data as { isNewColumn: boolean }
        return canEdit(null, 'dataType', data.isNewColumn)
      },
      onCellValueChanged: dataTypeChange,
      cellClass: (params) => {
        const data = params?.data as { isNewColumn: boolean }
        return canEdit(null, 'dataType', data.isNewColumn) ? canEditClass : ''
      },
    },
    /* UNITS: Only editable for Area, EUI, GHG, GHGI, Water use, WUI
    * Dropdowns are populated based on a unit type map
    */
    {
      field: 'units',
      headerName: 'Units',
      headerComponent: EditHeaderComponent,
      headerComponentParams: {
        name: 'Units',
      },
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: ({ data }: { data: { dataType: string } }) => {
        return {
          values: unitMap[data.dataType] ?? [],
        }
      },
      cellRenderer: dropdownRenderer,
      editable: (params) => {
        const data = params?.data as { dataType: string }
        return canEdit(data.dataType, 'units', null)
      },
      cellClass: (params) => {
        const data = params?.data as { dataType: string }
        return canEdit(data.dataType, 'units', null) ? canEditClass : ''
      },
    },
    { field: 'file_header', headerName: 'Data File Header' },
    { field: 'row1', headerName: 'Row 1' },
    { field: 'row2', headerName: 'Row 2' },
    { field: 'row3', headerName: 'Row 3' },
    { field: 'row4', headerName: 'Row 4' },
    { field: 'row5', headerName: 'Row 5' },
  ]

  const columnDefs = [
    { headerName: 'SEED', children: seedCols } as ColGroupDef,
    { headerName: uploadedFilename, children: fileCols } as ColGroupDef,
  ]

  return columnDefs
}
