export const CONDITIONS = [
  { key: 'exclude', value: 'Must Not Contain' },
  { key: 'include', value: 'Must Contain' },
  { key: 'required', value: 'Required' },
  { key: 'not_null', value: 'Not Null' },
  { key: 'range', value: 'Range' },
]

export const DATATYPES = [
  { key: 0, value: 'Number' },
  { key: 1, value: 'Text' },
  { key: 2, value: 'Date' },
  { key: 3, value: 'Year' },
  { key: 4, value: 'Area' },
  { key: 5, value: 'EUI' },
]

// RP TODO - make data types dynamic
// const allTypes = [
//   { key: 0, value: 'Number' },
//   { key: 1, value: 'Text' },
//   { key: 2, value: 'Date' },
//   { key: 3, value: 'Year' },
//   { key: 4, value: 'Area' },
//   { key: 5, value: 'EUI' },
// ]
// const textTypes = [
//   { key: 1, value: 'Text' },
// ]
// const numericTypes = [
//   { key: 0, value: 'Number' },
//   { key: 2, value: 'Date' },
//   { key: 3, value: 'Year' },
//   { key: 4, value: 'Area' },
//   { key: 5, value: 'EUI' },
// ]

// export const DATATYPES = {
//   exclude: textTypes,
//   include: textTypes,
//   not_null: allTypes,
//   range: numericTypes,
//   required: allTypes,
// }

export const INVENTORY_COLUMNS = ['enabled', 'field', 'data_type', 'condition', 'criteria', 'units', 'severity', 'status_label', 'actions']
// export const INVENTORY_COLUMNS = ['enabled', 'condition', 'field', 'data_type', 'min', 'max', 'units', 'severity', 'status_label', 'actions']
export const GOAL_COLUMNS = ['enabled', 'condition', 'field', 'data_type', 'min', 'max', 'units', 'severity', 'status_label', 'actions']

export const SEVERITY = [
  { key: 0, value: 'Error' },
  { key: 1, value: 'Warning' },
  { key: 2, value: 'Valid' },
]

export const UNITS = [
  { key: '', value: '' },
  { key: 'ft**2', value: 'square feet' },
  { key: 'm**2', value: 'square metres' },
  { key: 'kBtu/ft**2/year', value: 'kBtu/sq. ft./year' },
  { key: 'gal/ft**2/year', value: 'gal/sq. ft./year' },
  { key: 'GJ/m**2/year', value: 'GJ/m²/year' },
  { key: 'MJ/m**2/year', value: 'MJ/m²/year' },
  { key: 'kWh/m**2/year', value: 'kWh/m²/year' },
  { key: 'kBtu/m**2/year', value: 'kBtu/m²/year' },
]
