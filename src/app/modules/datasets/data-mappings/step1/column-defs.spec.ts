import type { ColDef, ColGroupDef } from 'ag-grid-community'
import { buildColumnDefs } from './column-defs'

describe('buildColumnDefs', () => {
  const getSeedHeaderColumn = (mappingSuggestionsReady: boolean): ColDef => {
    const noop = () => undefined
    const columnGroups = buildColumnDefs([], [], 'sample.csv', noop, noop, noop, mappingSuggestionsReady)
    const seedGroup = columnGroups[0] as ColGroupDef
    return seedGroup.children.find((column) => (column as ColDef).field === 'to_field_display_name') as ColDef
  }

  it('disables mapping edits while suggestions are pending', () => {
    expect(getSeedHeaderColumn(false).editable).toBe(false)
  })

  it('enables mapping edits after suggestions are ready', () => {
    expect(getSeedHeaderColumn(true).editable).toBe(true)
  })
})
