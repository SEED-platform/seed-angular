export type DerivedColumn = {
  expression: string;
  id: number;
  inventory_type: 'Property' | 'Tax Lot';
  name: string;
  organization: number;
  parameters: Parameter[];
}

export type Parameter = {
  derived_column: number;
  id: number;
  parameter_name: string;
  source_column: number;
}

export type DerivedColumnResponse = {
  status: string;
  derived_columns: DerivedColumn[];
}
