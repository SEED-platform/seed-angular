export type DerivedColumn = {
  expression: string;
  id: number;
  inventory_type: 'Property' | 'Tax Lot';
  name: string;
  organization: number;
  parameters: Parameter[];
}

export type Parameter = {
  derived_column?: number;
  id?: number;
  parameter_name: string;
  source_column: number;
}

export type DerivedColumnsResponse = {
  status: string;
  derived_columns: DerivedColumn[];
}

export type DerivedColumnResponse = {
  status: string;
  derived_column: DerivedColumn;
}
